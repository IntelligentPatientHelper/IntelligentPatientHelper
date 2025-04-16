from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import Dict, Optional, List
from datetime import datetime
import random
import json
import os

# Import our database connection
from database import db
from pydantic import BaseModel

# Import agents and router
from models.router import Router
from agents.patient_intake_agent import PatientIntakeAgent
from agents.diagnosis_agent import DiagnosisAgent
from agents.recommendation_agent import RecommendationAgent
from models.patient import Patient

# Initialize router and agents
router = Router()
patient_intake_agent = PatientIntakeAgent(db=db)
diagnosis_agent = DiagnosisAgent()
recommendation_agent = RecommendationAgent(db=db)

# Add agents to router
router.add_agent(patient_intake_agent)
router.add_agent(diagnosis_agent)
router.add_agent(recommendation_agent)

app = FastAPI(title="Intelligent Patient System")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# Pydantic models for request validation


class PatientRegistration(BaseModel):
    tc_number: str
    name: str
    email: str
    phone: str
    date_of_birth: str
    gender: Optional[str] = None


class AppointmentRequest(BaseModel):
    tc_number: str
    department: str
    doctor_id: str
    appointment_date: str


class ChatMessage(BaseModel):
    tc_number: str
    message: str

# Routes


@app.get("/")
async def root():
    return {"message": "Welcome to Intelligent Patient System API"}

# Patient check endpoint


@app.get("/api/patient/check/{tc_number}")
async def check_patient(tc_number: str):
    """Check if a patient exists in the database by TC number"""
    result = db.check_patient_exists(tc_number)
    return result

# Patient registration endpoint


@app.post("/api/patient/register")
async def register_patient(patient: PatientRegistration):
    """Register a new patient"""
    try:
        # Basit hasta modeli oluştur
        patient_model = Patient(
            tc_number=patient.tc_number,
            name=patient.name,
            email=patient.email,
            phone=patient.phone,
            date_of_birth=datetime.fromisoformat(
                patient.date_of_birth) if patient.date_of_birth else None,
            gender=patient.gender if patient.gender else "Not specified"
        )

        # Ajanlar ile hasta verilerini işle
        try:
            router.route(patient_model)
        except Exception as e:
            print(f"Ajan işleme hatası: {str(e)}")

        # Veritabanı ile hasta kaydı
        result = db.register_patient({
            "tc_number": patient.tc_number,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "phone": patient.phone,
            "email": patient.email
        })

        return result
    except Exception as e:
        print(f"Hasta kaydı hatası: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Hasta kaydı yapılamadı: {str(e)}")

# Chat endpoint for symptom analysis


@app.post("/api/chat")
async def process_chat(message: ChatMessage):
    """Process chat messages and detect symptoms"""
    # This is a simplified version - in a real implementation,
    # we would use NLP to analyze symptoms
    msg = message.message.lower()

    # Check for symptoms in the message
    detected_symptoms = []
    departments = []

    # Simple keyword matching for the demo
    symptom_keywords = {
        "headache": ["headache", "head pain", "migraine", "baş ağrısı"],
        "stomach pain": ["stomach", "belly", "nausea", "abdomen", "karın ağrısı", "mide"],
        "fever": ["fever", "temperature", "hot", "ateş"],
        "cough": ["cough", "throat", "phlegm", "öksürük", "boğaz"],
        "back pain": ["back pain", "backache", "sırt ağrısı"],
        "joint pain": ["joint", "arthritis", "eklem ağrısı", "eklem"],
        "eye pain": ["eye", "vision", "göz", "görme"],
        "skin rash": ["rash", "skin", "itch", "cilt", "döküntü", "kaşıntı"],
        "dizziness": ["dizzy", "vertigo", "balance", "baş dönmesi", "denge"],
        "breathing difficulty": ["breath", "inhale", "exhale", "suffocate", "nefes", "nefes darlığı"]
    }

    # Map departments to symptoms
    department_mapping = {
        "headache": ["Neurology", "ENT"],
        "stomach pain": ["Gastroenterology", "Internal Medicine"],
        "fever": ["Internal Medicine"],
        "cough": ["ENT", "Internal Medicine"],
        "back pain": ["Orthopedics", "Neurology"],
        "joint pain": ["Orthopedics", "Rheumatology"],
        "eye pain": ["Ophthalmology"],
        "skin rash": ["Dermatology"],
        "dizziness": ["ENT", "Neurology"],
        "breathing difficulty": ["Pulmonology", "Cardiology"]
    }

    # Detect symptoms from message
    for symptom, keywords in symptom_keywords.items():
        for keyword in keywords:
            if keyword in msg:
                detected_symptoms.append(symptom)

                # Add associated departments
                if symptom in department_mapping:
                    departments.extend(department_mapping[symptom])
                break

    # Remove duplicates
    detected_symptoms = list(set(detected_symptoms))
    departments = list(set(departments))

    # If no symptoms detected
    if not detected_symptoms:
        return {
            "message": "Semptomlarınızı anlayamadım. Lütfen nasıl hissettiğinizi daha detaylı anlatabilir misiniz?",
            "detected_symptoms": [],
            "action": "ask_more"
        }

    try:
        # Basit hasta modeli oluştur
        patient = Patient(
            tc_number=message.tc_number,
            name="Temporary User",  # Gerçek uygulamada veritabanından alınır
            symptoms=", ".join(detected_symptoms)
        )

        # Router ile hasta bilgilerini işle
        try:
            router.route(patient)
        except Exception as e:
            print(f"Ajan işleme hatası: {str(e)}")

        # Generate mock doctors for each department
        doctors = []
        for dept in departments:
            doctors.append({"name": f"Dr. John Smith", "department": dept})
            doctors.append({"name": f"Dr. Sarah Johnson", "department": dept})

        # Ajan analizlerini al
        diagnosis = diagnosis_agent.analyzeSymptoms({
            "primary": detected_symptoms,
            "secondary": []
        })

        recommendations = recommendation_agent.generateRecommendations(
            diagnosis)

        # Return response with detected symptoms and recommendations
        return {
            "message": f"Semptomlarınıza göre, şunları tespit ettim: {', '.join(detected_symptoms)}. " +
            f"Bu bölümlerdeki doktorlara başvurmanızı öneririm: {', '.join(departments)}.",
            "detected_symptoms": detected_symptoms,
            "severity": "medium",
            "recommended_departments": departments,
            "diagnosis": diagnosis,
            "recommendations": recommendations,
            "available_doctors": doctors,
            "action": "recommend_department"
        }
    except Exception as e:
        print(f"Sohbet işleme hatası: {str(e)}")
        # Yedek mekanizma
        doctors = []
        for dept in departments:
            doctors.append({"name": f"Dr. John Smith", "department": dept})
            doctors.append({"name": f"Dr. Sarah Johnson", "department": dept})

        return {
            "message": f"Semptomlarınıza göre, şunları tespit ettim: {', '.join(detected_symptoms)}. " +
            f"Bu bölümlerdeki doktorlara başvurmanızı öneririm: {', '.join(departments)}.",
            "detected_symptoms": detected_symptoms,
            "severity": "medium",
            "recommended_departments": departments,
            "initial_treatment": ["Dinlenin ve bol su için. Gerekirse reçetesiz ilaç alabilirsiniz."],
            "available_doctors": doctors,
            "action": "recommend_department"
        }

# Appointment booking endpoint


@app.post("/api/appointment/create")
async def create_appointment(appointment: AppointmentRequest):
    """Create a new appointment"""
    # Parse date
    try:
        appointment_date = appointment.appointment_date
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz tarih formatı")

    # Create appointment
    result = db.create_appointment({
        "tc_number": appointment.tc_number,
        "department": appointment.department,
        "doctor_id": appointment.doctor_id,
        # In real app, get doctor name from doctor_id
        "doctor_name": f"Dr. {appointment.doctor_id}",
        "appointment_date": appointment_date,
        "symptoms": ""  # In real app, pass symptoms from chat
    })

    return result

# Error handler


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
Intelligent Patient Helper API
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List

# Doğrudan database bağlantı bilgilerini tanımlıyoruz
DATABASE_URL = "postgresql://neondb_owner:npg_uBr4kN1VvOTf@ep-late-king-a5aqj7tw-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Database connection
def connect_to_db():
    """Connect to NeonDB"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Successfully connected to NeonDB")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Models
class Patient(BaseModel):
    tc_number: str
    name: str
    date_of_birth: str
    phone: str
    email: str
    gender: Optional[str] = ""

class Appointment(BaseModel):
    tc_number: str
    doctor_id: str
    doctor_name: str
    department: str
    appointment_date: str
    symptoms: Optional[str] = None

# Routes
@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Intelligent Patient Helper API"}

@app.get("/api/patient/check/{tc_number}")
def check_patient(tc_number: str):
    """Check if patient exists"""
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if user exists
        cursor.execute("SELECT * FROM patients WHERE tc_number = %s", (tc_number,))
        patient = cursor.fetchone()
        
        if patient:
            return {
                "exists": True,
                "patient": patient
            }
        
        return {
            "exists": False,
            "patient": None
        }
    except Exception as e:
        print(f"Error checking patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/patient/register")
def register_patient(patient: Patient):
    """Register a new patient"""
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM patients WHERE tc_number = %s", (patient.tc_number,))
        exists = cursor.fetchone()
        
        if exists:
            return {
                "success": False,
                "message": "Patient with this TC number already exists"
            }
        
        # Create user
        cursor.execute("""
            INSERT INTO patients (tc_number, name, date_of_birth, phone, email)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, tc_number, name, date_of_birth, phone, email
        """, (
            patient.tc_number,
            patient.name,
            patient.date_of_birth,
            patient.phone,
            patient.email
        ))
        
        conn.commit()
        new_patient = cursor.fetchone()
        
        return {
            "success": True,
            "message": "Patient registered successfully",
            "patient": new_patient
        }
    except Exception as e:
        conn.rollback()
        print(f"Error registering patient: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/api/appointment/create")
def create_appointment(appointment: Appointment):
    """Create a new appointment"""
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get patient ID
        cursor.execute("SELECT id FROM patients WHERE tc_number = %s", (appointment.tc_number,))
        patient = cursor.fetchone()
        
        if not patient:
            return {
                "success": False,
                "message": "Patient not found"
            }
        
        patient_id = patient["id"]
        
        # Create appointment
        cursor.execute("""
            INSERT INTO appointments (patient_id, doctor_id, doctor_name, department, appointment_date, symptoms)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, patient_id, doctor_id, doctor_name, department, appointment_date, symptoms
        """, (
            patient_id,
            appointment.doctor_id,
            appointment.doctor_name,
            appointment.department,
            appointment.appointment_date,
            appointment.symptoms
        ))
        
        conn.commit()
        new_appointment = cursor.fetchone()
        
        return {
            "success": True,
            "message": "Appointment created successfully",
            "appointment": new_appointment
        }
    except Exception as e:
        conn.rollback()
        print(f"Error creating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/appointment/list/{tc_number}")
def list_appointments(tc_number: str):
    """List all appointments for a patient"""
    conn = connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get patient ID
        cursor.execute("SELECT id FROM patients WHERE tc_number = %s", (tc_number,))
        patient = cursor.fetchone()
        
        if not patient:
            return {
                "success": False,
                "message": "Patient not found"
            }
        
        patient_id = patient["id"]
        
        # Get appointments
        cursor.execute("""
            SELECT id, doctor_id, doctor_name, department, appointment_date, symptoms, status
            FROM appointments
            WHERE patient_id = %s
            ORDER BY appointment_date DESC
        """, (patient_id,))
        
        appointments = cursor.fetchall()
        
        return {
            "success": True,
            "appointments": appointments
        }
    except Exception as e:
        print(f"Error listing appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# Yeni endpoint ekliyoruz - Frontend'in kullandığı yolu desteklemek için
@app.get("/api/appointments/patient/{tc_number}")
def get_patient_appointments(tc_number: str):
    """List all appointments for a patient - Alternative endpoint for frontend compatibility"""
    return list_appointments(tc_number)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("modified_main:app", host="0.0.0.0", port=8005, reload=True) 
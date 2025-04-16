from typing import Dict, List, Optional, Any
import os
from models.agent import Agent
from models.patient import Patient


class DiagnosisAgent(Agent):
    """
    Semptomları analiz eden ve teşhis sağlayan ajan.
    """

    def __init__(self):
        super().__init__(agent_name="DiagnosisAgent")
        self.agent_id = None  # Otomatik oluşturulacak veya atanacak
        self.llm_model = "llm"  # LLM model adı

        # Semptom-departman eşleştirme sözlüğü
        self.department_keywords = {
            "cardiology": ["chest pain", "heart", "blood pressure", "palpitations", "shortness of breath"],
            "neurology": ["headache", "dizziness", "seizure", "memory", "numbness", "tremor"],
            "orthopedics": ["joint pain", "fracture", "back pain", "muscle", "bone", "sprain"],
            "pediatrics": ["fever", "cough", "child", "growth", "development", "vaccination"],
            "dermatology": ["rash", "skin", "acne", "allergy", "itching", "dermatitis"],
            "ophthalmology": ["eye", "vision", "glasses", "retina", "cataract", "glaucoma"],
            "ent": ["ear", "nose", "throat", "sinus", "hearing", "taste"],
            "psychiatry": ["anxiety", "depression", "stress", "sleep", "mood", "behavior"],
            "gastroenterology": ["stomach", "digestion", "nausea", "vomiting", "diarrhea", "constipation"],
            "endocrinology": ["diabetes", "thyroid", "hormone", "metabolism", "weight", "growth"]
        }

        # Gelişmiş ML kütüphaneleri olmadan basit sınıflandırma
        self.vectorizer = None
        self.classifier = None

    def process(self, patient: Patient) -> None:
        """
        Hasta semptomlarını işler ve analiz eder.

        Args:
            patient (Patient): İşlenecek hasta
        """
        if not patient or not patient.symptoms:
            print(f"DiagnosisAgent: Hasta veya semptom bilgisi eksik.")
            return

        # Hasta semptomlarını analiz et
        patient_data = {
            "primary": [patient.symptoms] if patient.symptoms else [],
            "secondary": [],
            "duration": "",
            "severity": "moderate"
        }

        # Semptomları analiz et
        diagnosis = self.analyzeSymptoms(patient_data)
        print(
            f"DiagnosisAgent: {patient.tc_number} TC numaralı hasta için teşhis: {diagnosis}")

    def analyzeSymptoms(self, patient_data: Dict[str, Any]) -> str:
        """
        Hasta semptomlarını analiz eder.

        Args:
            patient_data (Dict): Hasta verileri (semptomlar)

        Returns:
            str: Analiz sonucu/teşhis
        """
        try:
            # Semptomları birleştir
            all_symptoms = " ".join(patient_data.get(
                "primary", [])) + " " + " ".join(patient_data.get("secondary", []))

            if not all_symptoms.strip():
                return "Yeterli semptom bilgisi yok"

            # Basit anahtar kelime eşleştirmesi ile departman ve teşhis oluştur
            matching_departments = []
            matching_scores = {}

            for dept, keywords in self.department_keywords.items():
                for keyword in keywords:
                    if keyword in all_symptoms.lower():
                        matching_departments.append(dept)
                        matching_scores[dept] = matching_scores.get(
                            dept, 0) + 1
                        break

            # En yüksek skorlu departmanları seç
            if matching_departments:
                sorted_departments = sorted(
                    matching_scores.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
                top_department = sorted_departments[0][0]
                diagnosis = f"Olası teşhis: {top_department.capitalize()} bölümü ile ilgili bir rahatsızlık"
            else:
                diagnosis = "Belirli bir teşhis yapılamadı. Genel bir muayene önerilir."

            return diagnosis

        except Exception as e:
            return f"Semptom analizi sırasında hata oluştu: {str(e)}"

    # Mevcut metotlar korunabilir
    def _determine_priority(self, symptoms: Dict) -> str:
        """Semptomlara göre öncelik seviyesini belirler."""
        urgent_keywords = ["severe", "emergency",
                           "acute", "critical", "pain", "bleeding"]
        severity = symptoms.get("severity", "moderate").lower()

        if severity == "severe" or any(keyword in str(symptoms).lower() for keyword in urgent_keywords):
            return "high"
        elif severity == "moderate":
            return "medium"
        else:
            return "low"

    def _generate_reason(self, department: str, symptoms: Dict) -> str:
        """Departman önerisi için neden oluşturur."""
        primary_symptoms = symptoms.get("primary", [])
        secondary_symptoms = symptoms.get("secondary", [])

        # Departmana özgü anahtar kelimeleri bul
        dept_keywords = self.department_keywords.get(department, [])
        matching_symptoms = []

        for symptom in primary_symptoms + secondary_symptoms:
            if any(keyword in symptom.lower() for keyword in dept_keywords):
                matching_symptoms.append(symptom)

        if matching_symptoms:
            return f"Based on symptoms: {', '.join(matching_symptoms)}"
        else:
            return f"Based on general assessment and department expertise"

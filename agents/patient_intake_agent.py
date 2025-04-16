from typing import Dict, Optional, Any
from datetime import datetime
from models.patient import Patient
from models.agent import Agent


class PatientIntakeAgent(Agent):
    """
    Hasta verilerini toplayan ve işleyen ajan.
    """

    def __init__(self, db=None):
        super().__init__(agent_name="PatientIntakeAgent")
        self.agent_id = None  # Otomatik oluşturulacak veya atanacak
        self.db = db
        self.patient_data = {}  # Map<String, String>

    def collectData(self, patient: Patient) -> Dict[str, str]:
        """
        Hasta verilerini toplar.

        Args:
            patient (Patient): Veri toplanacak hasta

        Returns:
            Dict[str, str]: Toplanan hasta verileri
        """
        if not patient:
            return {}

        # Hasta bilgilerini sözlüğe dönüştür
        self.patient_data = {
            "id": str(patient.id) if patient.id else "",
            "name": patient.name or "",
            "tc_number": patient.tc_number or "",
            "age": str(self._calculate_age(patient.date_of_birth)),
            "gender": patient.gender or "",
            "symptoms": patient.symptoms or "",
            "medicalHistory": patient.medical_history or ""
        }

        print(
            f"PatientIntakeAgent: {patient.tc_number} TC numaralı hasta verisi toplandı.")
        return self.patient_data

    def process(self, patient: Patient) -> None:
        """
        Hasta verilerini işler.

        Args:
            patient (Patient): İşlenecek hasta
        """
        if not patient:
            return

        self.collectData(patient)

    def _calculate_age(self, birth_date: Optional[datetime]) -> int:
        """
        Doğum tarihine göre yaş hesaplar.

        Args:
            birth_date (datetime, optional): Doğum tarihi

        Returns:
            int: Yaş
        """
        if not birth_date:
            return 0

        today = datetime.now()
        age = today.year - birth_date.year
        if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        return age

    def _save_to_database(self, patient: Patient) -> None:
        """
        Hasta verilerini veritabanına kaydeder.

        Args:
            patient (Patient): Kaydedilecek hasta
        """
        try:
            # Hasta zaten var mı kontrol et
            existing_patient = self.db.query(Patient).filter(
                Patient.tc_number == patient.tc_number
            ).first()

            if existing_patient:
                # Hasta bilgilerini güncelle
                existing_patient.name = patient.name
                existing_patient.email = patient.email
                existing_patient.phone = patient.phone
                existing_patient.gender = patient.gender
                existing_patient.updated_at = datetime.utcnow()
            else:
                # Yeni hasta ekle
                self.db.add(patient)

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            print(f"Error saving patient data: {str(e)}")

    # Mevcut diğer metotlar da korunabilir
    async def get_patient_history(self, tc_number: str) -> Dict:
        """
        Hasta geçmişini getirir.

        Args:
            tc_number (str): Hasta TC numarası

        Returns:
            Dict: Hasta geçmişi bilgileri
        """
        patient = self.db.query(Patient).filter(
            Patient.tc_number == tc_number
        ).first()

        if not patient:
            raise Exception("Patient not found")

        return {
            "patient_info": {
                "name": patient.name,
                "tc_number": patient.tc_number,
                "date_of_birth": patient.date_of_birth,
                "gender": patient.gender
            },
            "appointments": [
                {
                    "date": app.appointment_date,
                    "department": app.department,
                    "symptoms": app.symptoms,
                    "diagnosis": app.diagnosis
                }
                for app in patient.appointments
            ],
            "medical_history": [
                {
                    "condition": hist.condition,
                    "diagnosis_date": hist.diagnosis_date,
                    "treatment": hist.treatment,
                    "notes": hist.notes
                }
                for hist in patient.medical_history
            ],
            "medications": [
                {
                    "name": med.name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "start_date": med.start_date,
                    "end_date": med.end_date,
                    "is_active": med.is_active
                }
                for med in patient.medications
            ]
        }

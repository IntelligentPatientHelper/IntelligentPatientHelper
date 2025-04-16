from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from models.agent import Agent
from models.patient import Patient


class RecommendationAgent(Agent):
    """
    Teşhis sonuçlarına göre öneriler sunan ajan.
    """

    def __init__(self, db=None):
        super().__init__(agent_name="RecommendationAgent")
        self.agent_id = None  # Otomatik oluşturulacak veya atanacak
        self.db = db
        self.llm_model = "llm"  # LLM model adı

    def process(self, patient: Patient) -> None:
        """
        Hasta verilerini işleyerek öneriler oluşturur.

        Args:
            patient (Patient): İşlenecek hasta
        """
        if not patient:
            print(f"RecommendationAgent: Hasta bilgisi eksik.")
            return

        # Örnek bir teşhis oluştur (gerçek uygulamada DiagnosisAgent'tan alınır)
        diagnosis = "Genel muayene önerilir"
        if patient.symptoms:
            for keyword in ["baş ağrısı", "baş dönmesi", "headache", "dizzy"]:
                if keyword in patient.symptoms.lower():
                    diagnosis = "Nöroloji bölümünde değerlendirme önerilir"
                    break

        # Teşhise göre öneri oluştur
        recommendations = self.generateRecommendations(diagnosis)
        print(
            f"RecommendationAgent: {patient.tc_number} TC numaralı hasta için öneriler hazırlandı.")

    def generateRecommendations(self, diagnosis: str) -> str:
        """
        Teşhise göre öneriler oluşturur.

        Args:
            diagnosis (str): Teşhis sonucu

        Returns:
            str: Oluşturulan öneriler
        """
        # Teşhise göre basit öneri oluşturma
        recommendations = ""

        # Teşhiste belirli anahtar kelimeleri ara
        if "göğüs ağrısı" in diagnosis.lower() or "kalp" in diagnosis.lower() or "heart" in diagnosis.lower():
            recommendations += "Önerilen uzman: Kardiyoloji\n"
            recommendations += "İlk bakım: Dinlenin, ağır aktivitelerden kaçının\n"
        elif "baş ağrısı" in diagnosis.lower() or "nöroloji" in diagnosis.lower() or "headache" in diagnosis.lower() or "neurology" in diagnosis.lower():
            recommendations += "Önerilen uzman: Nöroloji\n"
            recommendations += "İlk bakım: Sessiz, karanlık bir odada dinlenin\n"
        elif "cilt" in diagnosis.lower() or "döküntü" in diagnosis.lower() or "skin" in diagnosis.lower() or "rash" in diagnosis.lower():
            recommendations += "Önerilen uzman: Dermatoloji\n"
            recommendations += "İlk bakım: Tahriş edici maddelerden kaçının, yumuşak sabun kullanın\n"
        else:
            recommendations += "Önerilen uzman: Aile Hekimi\n"
            recommendations += "İlk bakım: Semptomları izleyin, yeterince dinlenin\n"

        # Genel öneriler
        recommendations += "\nGenel öneriler:\n"
        recommendations += "- Bol su için\n"
        recommendations += "- Yeterli uyku alın\n"
        recommendations += "- Stresten kaçının\n"

        return recommendations

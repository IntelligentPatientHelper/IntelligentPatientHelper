# Intelligent Patient System

A modern healthcare platform for symptom analysis, doctor recommendations, and appointment scheduling.

## Features

- AI-powered symptom analysis
- Department and doctor recommendations
- Appointment scheduling
- Patient registration
- Responsive design for all devices

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: FastAPI (Python)
- **Database**: Neon PostgreSQL

## Getting Started

### Prerequisites

- Python 3.8+
- Neon DB account (https://neon.tech)

### Setting Up Neon DB

1. Create a free account on [Neon](https://neon.tech)
2. Create a new project
3. Create a new database
4. Copy your connection string from the Neon dashboard
5. Update the `.env` file with your connection string:

```
DATABASE_URL=postgres://your-username:your-password@your-neon-db-host/your-database
```

### Installation

1. Clone the repository
2. Install dependencies:

```
pip install -r requirements.txt
```

3. Run the application:

```
python -m uvicorn main:app --reload
```

4. Open your browser and navigate to `http://localhost:8000`

## API Endpoints

- `GET /api/patient/check/{tc_number}` - Check if a patient exists
- `POST /api/patient/register` - Register a new patient
- `POST /api/chat` - Process chat messages for symptom analysis
- `POST /api/appointment/create` - Create a new appointment

## Database Structure

The application uses Neon PostgreSQL with the following tables:

### Patients Table

| Column        | Type           | Description               |
|---------------|----------------|---------------------------|
| id            | SERIAL         | Primary key               |
| tc_number     | VARCHAR(11)    | Unique patient ID number  |
| name          | VARCHAR(100)   | Patient's full name       |
| date_of_birth | DATE           | Date of birth             |
| phone         | VARCHAR(20)    | Contact phone number      |
| email         | VARCHAR(100)   | Email address             |
| created_at    | TIMESTAMP      | Record creation timestamp |

### Appointments Table

| Column           | Type           | Description               |
|------------------|----------------|---------------------------|
| id               | SERIAL         | Primary key               |
| patient_id       | INTEGER        | Foreign key to patients   |
| department       | VARCHAR(100)   | Medical department        |
| doctor_name      | VARCHAR(100)   | Doctor's name             |
| doctor_id        | VARCHAR(100)   | Doctor's ID               |
| appointment_date | TIMESTAMP      | Appointment date and time |
| symptoms         | TEXT           | Patient's symptoms        |
| status           | VARCHAR(20)    | Appointment status        |
| created_at       | TIMESTAMP      | Record creation timestamp |

## Fallback Mechanism

The application includes a fallback to use in-memory data structures if the database connection fails. This ensures the application remains functional even without database access.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

KAFAYI YEMEK ÜZEREYİM ARTIK OLSUN.

## Kurulum ve Çalıştırma Talimatları

### Gereksinimler
- Python 3.9 veya üstü
- pip (Python paket yöneticisi)

### Yeni Bir Bilgisayara Kurulum

1. **Depoyu yeni bilgisayara kopyalayın:**
   ```
   git clone <repo-url> veya ZIP olarak indirip çıkartın
   ```

2. **Proje dizinine gidin:**
   ```
   cd IntelligentPatientHelper
   ```

3. **Sanal ortam oluşturun ve etkinleştirin:**
   ```
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # Mac/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

4. **Gerekli paketleri kurun:**
   ```
   pip install -r requirements.txt
   ```

### Uygulamayı Çalıştırma

#### Tek Komutla Çalıştırma (Önerilen)
Hem backend hem de frontend sunucularını tek bir komutla başlatmak için:

```
python start_app.py
```

Bu komut:
1. Backend API sunucusunu 8005 portunda başlatır
2. Frontend HTTP sunucusunu 8000 portunda başlatır
3. Tarayıcıda açmanız gereken URL'yi gösterir

Uygulama başladıktan sonra tarayıcınızda şu adresi açın: http://localhost:8000/index.html

#### Manuel Çalıştırma
İki farklı terminal penceresi açıp aşağıdaki komutları çalıştırabilirsiniz:

**Backend (API) sunucusu için:**
```
python modified_main.py
```

**Frontend (HTTP) sunucusu için:**
```
python -m http.server 8000
```

### Veritabanı Bağlantısı

Uygulama, NeonDB'yi kullanmaktadır. Eğer başka bir veritabanı kullanmak istiyorsanız, `modified_main.py` dosyasındaki `DATABASE_URL` değişkenini değiştirin:

```python
DATABASE_URL = "postgresql://kullanici:sifre@sunucu:port/veritabani?sslmode=require"
```

## Sorun Giderme

### Backend Çalışmıyor
Backend sunucusu (`modified_main.py`) çalışmıyorsa:
1. Python paketlerinin kurulu olduğundan emin olun
2. DATABASE_URL'nin doğru olduğunu kontrol edin

### Frontend Çalışmıyor
Frontend sunucusu çalışmıyorsa:
1. 8000 portunun başka bir uygulama tarafından kullanılmadığından emin olun
2. Python'un düzgün kurulu olduğunu kontrol edin

### Veritabanı Bağlantı Sorunları
1. Veritabanı bağlantı bilgilerinin doğru olduğunu kontrol edin
2. NeonDB hesabınızın aktif olduğundan emin olun
3. Ağ bağlantınızı kontrol edin

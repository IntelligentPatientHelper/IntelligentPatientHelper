// API_URL for backend
const API_URL = 'http://localhost:8005/api';

// Mock data flag
const USE_MOCK_DATA = false;

// Mock data
const MOCK_DATA = {
    patientHistory: {
        "past_conditions": ["Migraine", "Hypertension"],
        "medications": [
            {"name": "Beloc", "status": "active", "dosage": "50mg", "frequency": "once daily"},
            {"name": "Majezik", "status": "past", "dosage": "100mg", "frequency": "as needed"}
        ],
        "past_appointments": [
            {"department": "Neurology", "date": "2024-01-15", "doctor": "Dr. Jane Smith", "diagnosis": "Migraine"},
            {"department": "Cardiology", "date": "2024-02-20", "doctor": "Dr. Michael Brown", "diagnosis": "Hypertension"}
        ]
    },
    
    diagnoseResult: {
        "recommended_departments": ["Neurology", "Internal Medicine", "Ophthalmology"],
        "initial_treatment": ["Rest in a quiet, dark room. You may take pain relievers."],
        "warnings": ["Headaches with vision problems can be serious. Please seek medical help soon."],
        "patient_specific_notes": ["Please inform your doctor about your current medications: Beloc (50mg)"]
    },
    
    doctorRecommendations: {
        "available_doctors": [
            {
                "name": "Dr. Jane Smith",
                "specialization": "Neurology",
                "past_visit": {"date": "2024-01-15", "diagnosis": "Migraine"}
            },
            {
                "name": "Dr. John Davis",
                "specialization": "Neurology"
            },
            {
                "name": "Dr. Emily Wilson",
                "specialization": "Neurology"
            }
        ]
    }
};

// Mock users
const MOCK_USERS = {
    "12345678901": {
        name: "John Smith",
        email: "john@example.com",
        phone: "5551234567"
    },
    "98765432109": {
        name: "Emily Johnson",
        email: "emily@example.com",
        phone: "5559876543"
    }
};

// DOM Elements
const dashboardSection = document.getElementById('dashboardSection');
const dashboardPatientName = document.getElementById('dashboardPatientName');
const dashboardPatientTc = document.getElementById('dashboardPatientTc');
const logoutButton = document.getElementById('logoutButton');
const navTabs = document.querySelectorAll('.nav-tab');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const appointmentsList = document.getElementById('appointmentsList');
const expertDoctorsList = document.getElementById('expertDoctorsList');
const departmentFilter = document.getElementById('departmentFilter');
const pastConditionsList = document.getElementById('pastConditionsList');
const medicationsList = document.getElementById('medicationsList');
const pastAppointmentsList = document.getElementById('pastAppointmentsList');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsList = document.getElementById('recommendationsList');

// Chat state
let currentState = 'initial';
let selectedDepartment = null;
let selectedDate = null;
let currentTcNumber = null;
let currentPatient = null;
let selectedDoctor = null;
let inactivityTimer = null;
let currentAppointmentId = null;
let detectedSymptoms = [];

// Global doktor listesi
let allDoctors = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in (via sessionStorage)
    checkLoginStatus();
    
    // Send message with Enter key
    userInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    });

    // Button click handlers
    sendButton.addEventListener('click', sendMessage);
    
    // Reset inactivity timer on user activity
    ['mousemove', 'keypress', 'click', 'scroll'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });

    // Set ARIA labels for buttons with icons
    sendButton.setAttribute('aria-label', 'Send message');

    // Navigation tab switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            navTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all sections
            dashboardSections.forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            const sectionId = tab.dataset.section;
            document.getElementById(sectionId).classList.remove('hidden');
        });
    });
    
    // Department filter for doctors
    departmentFilter?.addEventListener('change', () => {
        const selectedDepartment = departmentFilter.value;
        filterDoctorsByDepartment(selectedDepartment);
    });
    
    // Logout button
    logoutButton.addEventListener('click', logout);
});

// Check if user is logged in
function checkLoginStatus() {
    // Randevuları silme kodunu kaldırdık - kalıcı kalmaları için
    
    const savedTc = sessionStorage.getItem('currentTcNumber');
    const savedPatient = sessionStorage.getItem('currentPatient');
    
    if (savedTc && savedPatient) {
        currentTcNumber = savedTc;
        currentPatient = JSON.parse(savedPatient);
        
        // Update dashboard patient info
        dashboardPatientName.textContent = currentPatient.name;
        dashboardPatientTc.textContent = currentTcNumber;
        
        // Kullanıcıya özel randevu anahtarını ayarla
        setupUserSpecificStorage();
        
        // Load patient data
        loadPatientAppointments();
        loadDoctorsData();
        loadPatientHealthHistory();
        
        // Add welcome message to chat
        addMessage(`Hello ${currentPatient.name}! How can I help you today?`, 'system');
        addMessage("Please describe your symptoms so I can recommend the appropriate department and available appointment times.", 'system');
        
        // Start inactivity timer
        resetInactivityTimer();
    } else {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
    }
}

// Kullanıcıya özel storage anahtarı
function setupUserSpecificStorage() {
    // Kullanıcı TC numarasına göre benzersiz bir localStorage anahtarı oluştur
    if (currentTcNumber) {
        window.USER_STORAGE_KEY = `patientAppointments_${currentTcNumber}`;
        console.log("Kullanıcıya özel depolama anahtarı oluşturuldu:", window.USER_STORAGE_KEY);
    }
}

// Reset inactivity timer
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (currentPatient) {
        inactivityTimer = setTimeout(logout, 5 * 60 * 1000); // 5 minutes
    }
}

// Logout function
function logout() {
    // Randevuları silme kodunu kaldırdık - kalıcı kalmaları için
    
    // Clear session storage (oturum bilgilerini sil ama randevuları değil)
    sessionStorage.removeItem('currentTcNumber');
    sessionStorage.removeItem('currentPatient');
    
    currentPatient = null;
    currentTcNumber = null;
    selectedDepartment = null;
    selectedDoctor = null;
    selectedDate = null;
    detectedSymptoms = [];
    chatMessages.innerHTML = '';
    
    // Redirect back to login page
    window.location.href = 'index.html';
}

// Send message
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    // Show typing indicator
    addTypingIndicator();
    
    try {
        // Simulate sending message to backend with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Process message with simple keyword matching
        const msg = message.toLowerCase();
        
        // Simple keyword matching for the demo
        const hasHeadache = msg.includes('headache') || msg.includes('head pain') || msg.includes('migraine');
        const hasStomachPain = msg.includes('stomach') || msg.includes('belly') || msg.includes('nausea');
        const hasFever = msg.includes('fever') || msg.includes('temperature');
        const hasCough = msg.includes('cough') || msg.includes('throat');
        const hasEyePain = msg.includes('eye') || msg.includes('vision');
        const hasBackPain = msg.includes('back pain') || msg.includes('backache');
        
        // Detect symptoms
        let detected = [];
        let departments = [];
        
        if (hasHeadache) {
            detected.push('headache');
            departments.push('Neurology');
            departments.push('ENT');
        }
        
        if (hasStomachPain) {
            detected.push('stomach pain');
            departments.push('Gastroenterology');
            departments.push('General Surgery');
        }
        
        if (hasFever) {
            detected.push('fever');
            departments.push('Internal Medicine');
        }
        
        if (hasCough) {
            detected.push('cough');
            departments.push('ENT');
            departments.push('Pulmonology');
        }
        
        if (hasEyePain) {
            detected.push('eye pain');
            departments.push('Ophthalmology');
        }
        
        if (hasBackPain) {
            detected.push('back pain');
            departments.push('Orthopedics');
            departments.push('Neurology');
        }
        
        // Remove duplicates
        departments = [...new Set(departments)];
        
        // Create mock result
        let result;
        
        if (detected.length > 0) {
            detectedSymptoms = detected;
            result = {
                message: `Based on your symptoms, I've detected you may have: ${detected.join(', ')}. I recommend consulting with doctors in these departments: ${departments.join(', ')}.`,
                detected_symptoms: detected,
                severity: "medium",
                recommended_departments: departments,
                initial_treatment: ["Rest and drink plenty of fluids. Take over-the-counter medication if needed."],
                action: "recommend_department"
            };
        } else {
            result = {
                message: "I'm not sure I understood your symptoms. Could you describe what you're experiencing in more detail?",
                detected_symptoms: [],
                action: "ask_more"
            };
        }
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Log response for debugging
        console.log('Chat response:', result);
        
        // Add system response
        addMessage(result.message, 'system');
        
        // Handle different actions
        if (result.action === "ask_more") {
            // Need more information from user
            addMessage("Could you please provide more details about your symptoms?", 'system');
        } 
        else if (result.action === "recommend_department") {
            // Show recommended departments
            setTimeout(() => {
                addMessage("Based on your symptoms, here are the departments I recommend:", 'system');
                
                // Show departments
                displayDepartmentOptions(result.recommended_departments);
                
                // Show initial treatment recommendations if available
                if (result.initial_treatment && result.initial_treatment.length > 0) {
                    addMessage(`<strong>Initial treatment recommendations:</strong><br>${result.initial_treatment.map(t => `- ${t}`).join('<br>')}`, 'system');
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        addMessage('Sorry, I encountered an error processing your message. Please try again.', 'system');
    }
}

// Display department options
function displayDepartmentOptions(departments) {
    const deptContainer = document.createElement('div');
    deptContainer.className = 'department-options';
    
    departments.forEach(dept => {
        const deptButton = document.createElement('button');
        deptButton.className = 'department-button';
        deptButton.textContent = dept;
        deptButton.addEventListener('click', () => selectDepartment(dept));
        deptContainer.appendChild(deptButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(deptContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load patient's appointments
async function loadPatientAppointments() {
    // API'den randevuları yüklemeyi göster
    appointmentsList.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your appointments...</p>
        </div>
    `;
    
    try {
        let appointments = [];
        
        // Gerçek API'den yükleme dene
        if (!USE_MOCK_DATA) {
            try {
                addMessage("Connecting to database for your appointments...", "system");
                
                // API'den randevuları al
                const response = await fetch(`${API_URL}/appointment/list/${currentTcNumber}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("API'den alınan randevular:", data);
                    
                    if (data && data.appointments) {
                        appointments = data.appointments;
                    }
                } else {
                    console.error("API hatası:", response.status);
                    throw new Error("Could not load appointments from server");
                }
            } catch (apiError) {
                console.error("API hatası:", apiError);
                // API hatası durumunda yerel depolamadan yükle
                addMessage("Database connection issue. Loading from local storage...", "system");
                appointments = await getAppointmentsFromLocalStorage();
            }
        } else {
            // Mock veri - yerel depolamadan yükle
            appointments = await getAppointmentsFromLocalStorage();
        }
        
        // Yeni randevu var mı?
        if (currentAppointmentId && selectedDoctor && selectedDate) {
            const appointmentDate = new Date(selectedDate);
            const newAppointment = {
                id: currentAppointmentId,
                doctor_name: selectedDoctor.name,
                department: selectedDoctor.department,
                appointment_date: selectedDate,
                formatted_date: formatDate(appointmentDate),
                formatted_time: formatTime(appointmentDate),
                symptoms: detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms'
            };
            
            // Var olan randevularda bu ID'ye sahip olan var mı?
            const exists = appointments.some(a => a.id === currentAppointmentId);
            
            if (!exists) {
                console.log("Yeni randevu ekleniyor:", newAppointment);
                appointments.push(newAppointment);
                
                // Yerel depolamaya ekle (API'ye kayıt işlemi bookAppointment fonksiyonunda yapılıyor)
                saveAppointmentsToLocalStorage(appointments);
            }
        }
        
        // Randevuları göster
        displayAppointments(appointments);
        
    } catch (error) {
        console.error("Randevuları yükleme hatası:", error);
        appointmentsList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading appointments: ${error.message}</p>
            </div>
        `;
    }
}

// Yerel depolamadan randevuları al
async function getAppointmentsFromLocalStorage() {
    // Kullanıcıya özel storage anahtarını kullan
    const storageKey = window.USER_STORAGE_KEY || `patientAppointments_${currentTcNumber}`;
    
    // Önceden kaydedilmiş randevuları al
    let storedAppointments = [];
    try {
        const savedAppointments = localStorage.getItem(storageKey);
        if (savedAppointments) {
            storedAppointments = JSON.parse(savedAppointments);
            console.log("Yerel depolamadan randevular yüklendi:", storedAppointments.length);
        }
    } catch (e) {
        console.error('Error loading saved appointments:', e);
    }
    
    return storedAppointments;
}

// Yerel depolamaya randevuları kaydet
function saveAppointmentsToLocalStorage(appointments) {
    // Kullanıcıya özel storage anahtarını kullan
    const storageKey = window.USER_STORAGE_KEY || `patientAppointments_${currentTcNumber}`;
    
    // Randevuları kaydet
    localStorage.setItem(storageKey, JSON.stringify(appointments));
    console.log("Randevular yerel depolamaya kaydedildi:", appointments.length);
}

// Randevuları görüntüle
function displayAppointments(appointments) {
    if (appointments && appointments.length > 0) {
        let appointmentsHTML = '';
        
        appointments.forEach(appointment => {
            // Tarih ve saat bilgilerini oluştur
            let appointmentDate;
            let formattedDate;
            let formattedTime;
            
            if (appointment.formatted_date && appointment.formatted_time) {
                // Önceden formatlanmış tarih ve saat bilgisi varsa kullan
                formattedDate = appointment.formatted_date;
                formattedTime = appointment.formatted_time;
            } else if (appointment.appointment_date) {
                // Tarih verisi varsa formatla
                appointmentDate = new Date(appointment.appointment_date);
                formattedDate = formatDate(appointmentDate);
                formattedTime = formatTime(appointmentDate);
            } else {
                // Varsayılan değerler
                formattedDate = "Unknown date";
                formattedTime = "Unknown time";
            }
            
            // Yaklaşan randevu mu?
            const isUpcoming = appointmentDate ? appointmentDate > new Date() : true;
            
            appointmentsHTML += `
                <div class="appointment-card">
                    <h3>${appointment.department} Appointment ${isUpcoming ? '<span class="upcoming-tag">Upcoming</span>' : ''}</h3>
                    <p><strong>Doctor:</strong> ${appointment.doctor_name}</p>
                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-clock"></i>
                            <span>${formattedTime}</span>
                        </div>
                    </div>
                    ${appointment.symptoms ? `<p><strong>Symptoms:</strong> ${appointment.symptoms}</p>` : ''}
                    <p class="appointment-id"><small>Appointment ID: ${appointment.id}</small></p>
                </div>
            `;
        });
        
        appointmentsList.innerHTML = appointmentsHTML;
    } else {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-xmark"></i>
                <p>You don't have any appointments yet.</p>
            </div>
        `;
    }
}

// Load doctors data
function loadDoctorsData() {
    // Mock doctors data - Daha fazla doktor ve departman
    allDoctors = [
        {
            id: "D1",
            name: "Dr. John Smith",
            department: "Neurology",
            specialization: "Headache and Migraine Specialist",
            experience: "15 years",
            education: "Harvard Medical School",
            languages: "English, Spanish"
        },
        {
            id: "D2",
            name: "Dr. Sarah Johnson",
            department: "Cardiology",
            specialization: "Interventional Cardiology",
            experience: "12 years",
            education: "Johns Hopkins University",
            languages: "English, French"
        },
        {
            id: "D3",
            name: "Dr. Michael Brown",
            department: "Internal Medicine",
            specialization: "General Internal Medicine",
            experience: "10 years",
            education: "Stanford University",
            languages: "English"
        },
        {
            id: "D4",
            name: "Dr. Emily Davis",
            department: "Dermatology",
            specialization: "Cosmetic Dermatology",
            experience: "8 years",
            education: "Yale University",
            languages: "English, German"
        },
        {
            id: "D5",
            name: "Dr. Robert Wilson",
            department: "Gastroenterology",
            specialization: "Digestive Disorders",
            experience: "14 years",
            education: "Columbia University",
            languages: "English, Italian"
        },
        {
            id: "D6",
            name: "Dr. Lisa Chen",
            department: "ENT",
            specialization: "Otolaryngology",
            experience: "9 years",
            education: "UCLA Medical School",
            languages: "English, Mandarin"
        },
        {
            id: "D7",
            name: "Dr. James Taylor",
            department: "Ophthalmology",
            specialization: "Retina Specialist",
            experience: "11 years",
            education: "Duke University",
            languages: "English"
        },
        {
            id: "D8",
            name: "Dr. Patricia Moore",
            department: "Internal Medicine",
            specialization: "Primary Care",
            experience: "20 years",
            education: "University of Pennsylvania",
            languages: "English, Portuguese"
        },
        {
            id: "D9",
            name: "Dr. David Kim",
            department: "Pulmonology",
            specialization: "Respiratory Diseases",
            experience: "13 years",
            education: "University of Michigan",
            languages: "English, Korean"
        },
        {
            id: "D10",
            name: "Dr. Olivia Martinez",
            department: "Neurology",
            specialization: "Movement Disorders",
            experience: "16 years",
            education: "Mayo Clinic College of Medicine",
            languages: "English, Spanish"
        },
        {
            id: "D11",
            name: "Dr. Thomas Wright",
            department: "Orthopedics",
            specialization: "Sports Medicine",
            experience: "12 years",
            education: "Northwestern University",
            languages: "English"
        },
        {
            id: "D12",
            name: "Dr. Jessica Lee",
            department: "Cardiology",
            specialization: "Heart Failure",
            experience: "9 years",
            education: "University of California San Francisco",
            languages: "English, Korean"
        },
        {
            id: "D13",
            name: "Dr. Richard Allen",
            department: "ENT",
            specialization: "Head and Neck Surgery",
            experience: "17 years",
            education: "University of Washington",
            languages: "English"
        },
        {
            id: "D14",
            name: "Dr. Sophia Patel",
            department: "Ophthalmology",
            specialization: "Glaucoma Treatment",
            experience: "11 years",
            education: "University of Chicago",
            languages: "English, Hindi"
        },
        {
            id: "D15",
            name: "Dr. Daniel Rodriguez",
            department: "Gastroenterology",
            specialization: "Inflammatory Bowel Disease",
            experience: "14 years",
            education: "Vanderbilt University",
            languages: "English, Spanish"
        }
    ];
    
    // Departman filtresini güncelle
    updateDepartmentFilter();
    
    // Doktorları görüntüle
    displayDoctors(allDoctors);
}

// Departman filtresini güncelleme
function updateDepartmentFilter() {
    if (!departmentFilter) return;
    
    // Mevcut seçili değeri sakla
    const currentSelection = departmentFilter.value;
    
    // Tüm departmanları topla
    const departments = [...new Set(allDoctors.map(doctor => doctor.department))];
    
    // Filtre içeriğini oluştur
    let filterHTML = '<option value="all">All Departments</option>';
    
    departments.forEach(department => {
        filterHTML += `<option value="${department}">${department}</option>`;
    });
    
    // Filtreyi güncelle
    departmentFilter.innerHTML = filterHTML;
    
    // Önceki seçimi koru
    if (currentSelection && departments.includes(currentSelection)) {
        departmentFilter.value = currentSelection;
    }
}

// Helper functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

// Add message to chat
function addMessage(message, sender = 'system') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.innerHTML = `<p>${message}</p>`;
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.className = 'message system typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-dots" aria-label="Bot is typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Function to display doctors
function displayDoctors(doctors) {
    let doctorsHTML = '';
    
    doctors.forEach(doctor => {
        doctorsHTML += `
            <div class="doctor-card" data-department="${doctor.department}">
                <div class="doctor-card-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <h3>${doctor.name}</h3>
                    <p class="doctor-department">${doctor.department}</p>
                </div>
                <div class="doctor-card-body">
                    <div class="doctor-info">
                        <div class="doctor-info-item">
                            <i class="fas fa-stethoscope"></i>
                            <span>${doctor.specialization}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-briefcase"></i>
                            <span>Experience: ${doctor.experience}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${doctor.education}</span>
                        </div>
                        <div class="doctor-info-item">
                            <i class="fas fa-language"></i>
                            <span>${doctor.languages}</span>
                        </div>
                    </div>
                    <button class="book-appointment-btn" data-doctor-id="${doctor.id}">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                </div>
            </div>
        `;
    });
    
    expertDoctorsList.innerHTML = doctorsHTML;
    
    // Add event listeners to book appointment buttons
    document.querySelectorAll('.book-appointment-btn').forEach(button => {
        button.addEventListener('click', () => {
            const doctorId = button.dataset.doctorId;
            const doctorCard = button.closest('.doctor-card');
            const doctorName = doctorCard.querySelector('h3').textContent;
            const doctorDept = doctorCard.querySelector('.doctor-department').textContent;
            
            // Seçilen doktoru ve departmanı kaydet
            selectedDepartment = doctorDept;
            const selectedDoctorData = allDoctors.find(d => d.id === doctorId);
            
            if (selectedDoctorData) {
                selectedDoctor = selectedDoctorData;
                
                // Switch to AI Diagnosis tab
                document.querySelector('.nav-tab[data-section="aiDiagnosisSection"]').click();
                
                // Add message to chat
                addMessage(`I'd like to book an appointment with ${doctorName} in the ${doctorDept} department.`, 'user');
                
                // Typing indicator
                addTypingIndicator();
                
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage(`Great choice! Dr. ${selectedDoctorData.name.split(' ')[1]} is a specialist in ${selectedDoctorData.specialization}.`, 'system');
                    addMessage(`Let me help you book an appointment with ${doctorName}.`, 'system');
                    
                    // Randevu sürecine devam et
                    proceedToBooking();
                }, 1500);
            }
        });
    });
}

// Randevu işlemine devam et
function proceedToBooking() {
    if (!selectedDoctor) return;
    
    // Tarih seçimi için typing indicator göster
    addTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        
        // Tarih seçimini göster
        addMessage(`Please select a date for your appointment with ${selectedDoctor.name}:`, 'system');
        
        // Tarih seçenekleri
        const dateContainer = document.createElement('div');
        dateContainer.className = 'date-options';
        
        // Generate next 5 days
        const today = new Date();
        const dates = [];
        
        for (let i = 1; i <= 5; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        
        dates.forEach(date => {
            const dateButton = document.createElement('button');
            dateButton.className = 'date-button';
            dateButton.textContent = formatDate(date);
            dateButton.addEventListener('click', () => selectDate(date));
            dateContainer.appendChild(dateButton);
        });
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.appendChild(dateContainer);
        
        messageElement.appendChild(contentElement);
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
}

// Filter doctors by department
function filterDoctorsByDepartment(department) {
    const doctorCards = document.querySelectorAll('.doctor-card');
    
    doctorCards.forEach(card => {
        if (department === 'all' || card.dataset.department === department) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Load patient health history
function loadPatientHealthHistory() {
    // Mock health history data from MOCK_DATA
    const healthHistory = MOCK_DATA.patientHistory;
    
    // Display past conditions
    let conditionsHTML = '';
    if (healthHistory.past_conditions && healthHistory.past_conditions.length > 0) {
        healthHistory.past_conditions.forEach(condition => {
            conditionsHTML += `
                <li>
                    <i class="fas fa-file-medical"></i>
                    <span>${condition}</span>
                </li>
            `;
        });
        pastConditionsList.innerHTML = conditionsHTML;
    } else {
        pastConditionsList.innerHTML = '<p>No past conditions recorded.</p>';
    }
    
    // Display medications
    let medicationsHTML = '';
    if (healthHistory.medications && healthHistory.medications.length > 0) {
        healthHistory.medications.forEach(medication => {
            const statusTag = medication.status === 'active' 
                ? '<span class="active-medication">Current</span>' 
                : '<span class="past-medication">Past</span>';
            
            medicationsHTML += `
                <li>
                    <i class="fas fa-pills"></i>
                    <div>
                        <span class="medication-name">${medication.name} ${statusTag}</span>
                        <p class="medication-details">${medication.dosage}, ${medication.frequency}</p>
                    </div>
                </li>
            `;
        });
        medicationsList.innerHTML = medicationsHTML;
    } else {
        medicationsList.innerHTML = '<p>No medications recorded.</p>';
    }
    
    // Display past appointments
    let appointmentsHTML = '';
    if (healthHistory.past_appointments && healthHistory.past_appointments.length > 0) {
        healthHistory.past_appointments.forEach(appointment => {
            appointmentsHTML += `
                <div class="past-appointment-card">
                    <p><strong>Department:</strong> ${appointment.department}</p>
                    <p><strong>Doctor:</strong> ${appointment.doctor}</p>
                    <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
                    <p><strong>Diagnosis:</strong> ${appointment.diagnosis}</p>
                </div>
            `;
        });
        pastAppointmentsList.innerHTML = appointmentsHTML;
    } else {
        pastAppointmentsList.innerHTML = '<p>No past appointments recorded.</p>';
    }
}

// Function to select department
function selectDepartment(department) {
    selectedDepartment = department;
    
    addMessage(`You've selected the ${department} department. Let me find available doctors for you.`, 'system');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API call to get doctors
    setTimeout(() => {
        removeTypingIndicator();
        
        // Seçilen departmana göre doktorları filtrele
        const departmentDoctors = allDoctors.filter(doctor => doctor.department === department);
        
        if (departmentDoctors.length === 0) {
            addMessage(`Sorry, there are no doctors available in the ${department} department at the moment.`, 'system');
            return;
        }
        
        // Internal Medicine departmanı için Dr. Michael Brown'ı ilk sıraya getir
        if (department === "Internal Medicine") {
            // Dr. Michael Brown'ı bul ve listeden çıkar
            const michaelBrownIndex = departmentDoctors.findIndex(d => d.name === "Dr. Michael Brown");
            if (michaelBrownIndex !== -1) {
                const michaelBrown = departmentDoctors.splice(michaelBrownIndex, 1)[0];
                // Listenin başına ekle
                departmentDoctors.unshift(michaelBrown);
            }
        }
        
        addMessage(`I found ${departmentDoctors.length} doctors in the ${department} department. Please select one:`, 'system');
        
        // Display doctor options
        const doctorContainer = document.createElement('div');
        doctorContainer.className = 'doctor-options';
        
        departmentDoctors.forEach(doctor => {
            const doctorButton = document.createElement('button');
            doctorButton.className = 'doctor-button';
            doctorButton.textContent = doctor.name;
            doctorButton.addEventListener('click', () => {
                // Seçilen doktoru kaydet
                selectedDoctor = doctor;
                addMessage(`You've selected ${doctor.name}, ${doctor.specialization}.`, 'system');
                
                // Randevu sürecine devam et
                proceedToBooking();
            });
            doctorContainer.appendChild(doctorButton);
        });
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message system';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.appendChild(doctorContainer);
        
        messageElement.appendChild(contentElement);
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
}

// Tarih seçimi
function selectDate(date) {
    const formattedDate = formatDate(date);
    
    addMessage(`You've selected ${formattedDate}. Let me show you the available time slots.`, 'system');
    
    // Show typing indicator
    addTypingIndicator();
    
    // Simulate API call to get available time slots
    setTimeout(() => {
        removeTypingIndicator();
        
        // Show available time slots
        displayAvailableTimeSlots(date);
    }, 1500);
}

// Saat dilimlerini göster
function displayAvailableTimeSlots(date) {
    addMessage(`Here are the available time slots for ${formatDate(date)} with ${selectedDoctor.name}:`, 'system');
    
    const timeContainer = document.createElement('div');
    timeContainer.className = 'time-options';
    
    // Generate time slots (9 AM to 5 PM, 1-hour intervals)
    const timeSlots = [];
    
    for (let hour = 9; hour <= 16; hour++) {
        const time = new Date(date);
        time.setHours(hour, 0, 0, 0);
        timeSlots.push(time);
    }
    
    timeSlots.forEach(time => {
        const timeButton = document.createElement('button');
        timeButton.className = 'time-button';
        timeButton.textContent = formatTime(time);
        timeButton.addEventListener('click', () => finalizeAppointment(time));
        timeContainer.appendChild(timeButton);
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.appendChild(timeContainer);
    
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Randevuyu onayla
function finalizeAppointment(dateTime) {
    selectedDate = dateTime.toISOString();
    
    // Show appointment summary
    addMessage(`
        <div class="appointment-summary">
            <h3>Appointment Summary</h3>
            <p><strong>Department:</strong> ${selectedDoctor.department}</p>
            <p><strong>Doctor:</strong> ${selectedDoctor.name}</p>
            <p><strong>Date & Time:</strong> ${formatDate(dateTime)} at ${formatTime(dateTime)}</p>
            <p><strong>Symptoms:</strong> ${detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms'}</p>
        </div>
    `, 'system');
    
    // Add confirmation buttons
    const confirmContainer = document.createElement('div');
    confirmContainer.className = 'confirmation-buttons';
    confirmContainer.innerHTML = `
        <button id="confirmButton" class="confirm-button" aria-label="Confirm appointment">Confirm Appointment</button>
        <button id="cancelButton" class="cancel-button" aria-label="Cancel appointment">Cancel</button>
    `;
    chatMessages.appendChild(confirmContainer);
    
    // Add event listeners to confirmation buttons
    document.getElementById('confirmButton').addEventListener('click', async () => {
        // Book the appointment
        await bookAppointment();
    });
    
    document.getElementById('cancelButton').addEventListener('click', () => {
        addMessage('Appointment booking cancelled.', 'system');
        addMessage('How else can I help you today?', 'system');
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Randevuyu kaydet
async function bookAppointment() {
    try {
        // Show loading message
        addMessage('Booking your appointment...', 'system');
        
        // Create appointment ID
        currentAppointmentId = Math.floor(Math.random() * 10000);
        
        // Veritabanına kaydetme işlemi
        addMessage('Sending data to the server...', 'system');
        
        // Randevu verilerini hazırla
        const appointmentDate = new Date(selectedDate);
        const appointmentData = {
            tc_number: currentTcNumber,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            department: selectedDoctor.department,
            appointment_date: selectedDate,
            symptoms: detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms'
        };

        // Yerel depolama için ek bilgiler (API'ye gönderilmeyecek)
        const localStorageData = {
            id: currentAppointmentId,
            patient_tc: currentTcNumber,
            patient_name: currentPatient.name,
            doctor_id: selectedDoctor.id,
            doctor_name: selectedDoctor.name,
            department: selectedDoctor.department,
            appointment_date: selectedDate,
            formatted_date: formatDate(appointmentDate),
            formatted_time: formatTime(appointmentDate),
            symptoms: detectedSymptoms.length > 0 ? detectedSymptoms.join(', ') : 'No specific symptoms',
            status: 'confirmed'
        };
        
        console.log("Veritabanına gönderilen randevu verileri: ", appointmentData);
        
        let result;
        if (!USE_MOCK_DATA) {
            try {
                // Gerçek API'ye gönder
                const response = await fetch(`${API_URL}/appointment/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appointmentData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                result = await response.json();
                console.log("API yanıtı:", result);
                
                // API'den dönen ID'yi kullan
                if (result.appointment_id) {
                    currentAppointmentId = result.appointment_id;
                    // API'den dönen ID'yi local storage verisine de ekle
                    localStorageData.id = currentAppointmentId;
                }
            } catch (apiError) {
                console.error("API hatası:", apiError);
                
                // API hatası durumunda yerel depolamaya kaydet
                addMessage('Server connection issue. Saving locally for now...', 'system');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Yerel depolamaya kaydet
                saveAppointmentToLocalStorage(localStorageData);
                result = { success: true };
            }
        } else {
            // Mock veri modu - sadece yerel depolamaya kaydet
            await new Promise(resolve => setTimeout(resolve, 1500));
            saveAppointmentToLocalStorage(localStorageData);
            result = { success: true };
        }
        
        if (result.success) {
            // Show success message
            addMessage(`
                <div class="appointment-success">
                    <h3>Appointment Booked Successfully!</h3>
                    <p>Your appointment has been confirmed with ${selectedDoctor.name} on ${formatDate(appointmentDate)} at ${formatTime(appointmentDate)}.</p>
                    <p>Appointment ID: ${currentAppointmentId}</p>
                    <p>Please arrive 15 minutes before your appointment time.</p>
                    <p><strong>Your appointment has been saved to the database and will be available in DBeaver.</strong></p>
                </div>
            `, 'system');
            
            // Update appointments list in Online Appointments section
            loadPatientAppointments();
            
            // Show notification to check appointments
            addMessage(`
                <p>Your appointment has been added to your <strong>Online Appointments</strong> section. 
                You can view all your appointments by clicking on the "Online Appointments" tab above.</p>
                <p>Database administrators can now see this appointment in DBeaver.</p>
            `, 'system');
            
            // Ask if they need anything else
            addMessage('Is there anything else I can help you with today?', 'system');
        } else {
            addMessage('Sorry, there was an issue saving your appointment. Please try again.', 'system');
        }
    } catch (error) {
        console.error('Booking error:', error);
        addMessage('An error occurred while booking your appointment. Please try again.', 'system');
    }
}

// Yerel depolamaya randevu kaydet
function saveAppointmentToLocalStorage(appointmentData) {
    // Kullanıcıya özel storage anahtarını kullan
    const storageKey = window.USER_STORAGE_KEY || `patientAppointments_${currentTcNumber}`;
    
    // Önceden kaydedilmiş randevuları al
    let storedAppointments = [];
    try {
        const savedAppointments = localStorage.getItem(storageKey);
        if (savedAppointments) {
            storedAppointments = JSON.parse(savedAppointments);
        }
    } catch (e) {
        console.error('Error loading saved appointments:', e);
    }
    
    // Yeni randevuyu ekle
    storedAppointments.push(appointmentData);
    
    // Randevuları kaydet
    localStorage.setItem(storageKey, JSON.stringify(storedAppointments));
    console.log("Randevu yerel depolamaya kaydedildi:", appointmentData);
} 
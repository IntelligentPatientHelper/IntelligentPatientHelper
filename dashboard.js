// API_URL for backend
const API_URL = 'http://localhost:8000/api';

// Mock data flag
const USE_MOCK_DATA = true;

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
    const savedTc = sessionStorage.getItem('currentTcNumber');
    const savedPatient = sessionStorage.getItem('currentPatient');
    
    if (savedTc && savedPatient) {
        currentTcNumber = savedTc;
        currentPatient = JSON.parse(savedPatient);
        
        // Update dashboard patient info
        dashboardPatientName.textContent = currentPatient.name;
        dashboardPatientTc.textContent = currentTcNumber;
        
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
    // Clear session storage
    sessionStorage.removeItem('currentTcNumber');
    sessionStorage.removeItem('currentPatient');
    
    // Clear variables
    currentPatient = null;
    currentTcNumber = null;
    selectedDepartment = null;
    selectedDoctor = null;
    selectedDate = null;
    detectedSymptoms = [];
    
    // Redirect to login page
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

// Other functions used in dashboard
// Load patient's appointments
function loadPatientAppointments() {
    // Check if patient has any appointments in mock data
    const patientAppointments = [];
    
    // Add the newly booked appointment if available
    if (currentAppointmentId) {
        const appointmentDate = new Date(selectedDate);
        patientAppointments.push({
            id: currentAppointmentId,
            doctor_name: selectedDoctor ? selectedDoctor.name : 'Dr. John Smith',
            department: selectedDepartment,
            appointment_date: appointmentDate,
            symptoms: detectedSymptoms.join(', ')
        });
    }
    
    // For demo purposes, add a mock appointment if the list is empty
    if (patientAppointments.length === 0 && Math.random() > 0.5) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
        futureDate.setHours(9 + Math.floor(Math.random() * 7), 0, 0, 0);
        
        patientAppointments.push({
            id: Math.floor(Math.random() * 1000),
            doctor_name: 'Dr. Sarah Johnson',
            department: 'Cardiology',
            appointment_date: futureDate,
            symptoms: 'Chest pain, shortness of breath'
        });
    }
    
    // Display appointments
    if (patientAppointments.length > 0) {
        let appointmentsHTML = '';
        
        patientAppointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.appointment_date);
            const isUpcoming = appointmentDate > new Date();
            
            appointmentsHTML += `
                <div class="appointment-card">
                    <h3>${appointment.department} Appointment ${isUpcoming ? '<span class="upcoming-tag">Upcoming</span>' : ''}</h3>
                    <p><strong>Doctor:</strong> ${appointment.doctor_name}</p>
                    <div class="appointment-details">
                        <div class="appointment-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(appointmentDate)}</span>
                        </div>
                        <div class="appointment-detail">
                            <i class="fas fa-clock"></i>
                            <span>${formatTime(appointmentDate)}</span>
                        </div>
                    </div>
                    ${appointment.symptoms ? `<p><strong>Symptoms:</strong> ${appointment.symptoms}</p>` : ''}
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
    // Mock doctors data
    const doctors = [
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
            department: "Orthopedics",
            specialization: "Sports Medicine",
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
        }
    ];
    
    displayDoctors(doctors);
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
            
            // Switch to AI Diagnosis tab
            document.querySelector('.nav-tab[data-section="aiDiagnosisSection"]').click();
            
            // Add message to chat
            addMessage(`I'd like to book an appointment with ${doctorName} in the ${doctorDept} department.`, 'user');
        });
    });
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
        
        // Display doctors for the selected department
        const doctors = [
            { id: "D1", name: "Dr. John Smith", department, available: true },
            { id: "D2", name: "Dr. Sarah Johnson", department, available: true },
            { id: "D3", name: "Dr. Michael Brown", department, available: true }
        ];
        
        // Display doctor options
        const doctorContainer = document.createElement('div');
        doctorContainer.className = 'doctor-options';
        
        doctors.forEach(doctor => {
            const doctorButton = document.createElement('button');
            doctorButton.className = 'doctor-button';
            doctorButton.textContent = doctor.name;
            doctorButton.addEventListener('click', () => {
                addMessage(`You've selected ${doctor.name}. Redirecting to appointments tab...`, 'system');
                
                // Switch to appointments tab
                setTimeout(() => {
                    document.querySelector('.nav-tab[data-section="appointmentsSection"]').click();
                }, 1500);
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
// API_URL for backend
const API_URL = 'http://localhost:8005/api';

// Debug mode
const DEBUG = true;

// Mock data flag
const USE_MOCK_DATA = true;

// Load saved users from localStorage if available
let MOCK_USERS = {
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

// Try to load saved users from localStorage
try {
    const savedUsers = localStorage.getItem('mockUsers');
    if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        // Merge with default users, keeping any existing ones
        MOCK_USERS = { ...MOCK_USERS, ...parsedUsers };
        console.log('Loaded saved users from localStorage:', MOCK_USERS);
    }
} catch (e) {
    console.error('Error loading saved users:', e);
}

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const tcInput = document.getElementById('tcInput');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const showRegisterButton = document.getElementById('showRegisterButton');
const showLoginButton = document.getElementById('showLoginButton');
const notification = document.getElementById('notification');

// Registration form elements
const registerTcInput = document.getElementById('registerTcInput');
const nameInput = document.getElementById('nameInput');
const dobInput = document.getElementById('dobInput');
const phoneInput = document.getElementById('phoneInput');
const emailInput = document.getElementById('emailInput');

// State
let currentTcNumber = null;
let currentPatient = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    checkSession();
    
    // Login with Enter key
    tcInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await loginUser();
        }
    });

    // Button click handlers
    loginButton.addEventListener('click', loginUser);
    registerButton.addEventListener('click', register);
    
    // Toggle registration/login form
    showRegisterButton.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });
    
    showLoginButton.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });
});

// Check if session exists
function checkSession() {
    const savedTc = sessionStorage.getItem('currentTcNumber');
    const savedPatient = sessionStorage.getItem('currentPatient');
    
    if (savedTc && savedPatient) {
        // Already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

// Login user
async function loginUser() {
    const tcNumber = tcInput.value.trim();
    
    if (!tcNumber || tcNumber.length !== 11 || isNaN(tcNumber)) {
        showNotification('Please enter a valid 11-digit ID number', 'error');
        return;
    }
    
    try {
        // Show loading state
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Checking...';
        loginButton.disabled = true;
        
        // Log API call for debugging
        console.log(`Checking patient with TC: ${tcNumber}`);
        
        // Simulate API call with mock data
        let result;
        if (USE_MOCK_DATA) {
            // Add a small delay to simulate network request
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Get the latest mock users from localStorage
            try {
                const savedUsers = localStorage.getItem('mockUsers');
                if (savedUsers) {
                    const parsedUsers = JSON.parse(savedUsers);
                    // Update MOCK_USERS with the latest data
                    MOCK_USERS = { ...MOCK_USERS, ...parsedUsers };
                    console.log('Updated MOCK_USERS from localStorage for login check:', MOCK_USERS);
                }
            } catch (e) {
                console.error('Error loading saved users during login:', e);
            }
            
            // Check if patient exists in mock users
            if (MOCK_USERS[tcNumber]) {
                result = {
                    exists: true,
                    patient: MOCK_USERS[tcNumber]
                };
            } else {
                result = {
                    exists: false,
                    patient: null
                };
            }
        } else {
            // In a real app, we would make an actual API call here
            const response = await fetch(`${API_URL}/patient/check/${tcNumber}`);
            result = await response.json();
        }
        
        // Log response for debugging
        console.log('Patient check response:', result);
        
        // Reset button state
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> Sign In';
        loginButton.disabled = false;
        
        if (result.exists) {
            // Patient exists, save to session and redirect to dashboard
            currentTcNumber = tcNumber;
            currentPatient = result.patient;
            
            // Save to session storage
            sessionStorage.setItem('currentTcNumber', currentTcNumber);
            sessionStorage.setItem('currentPatient', JSON.stringify(currentPatient));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Patient not found, redirect to registration
            showNotification('User not found. Please register first.', 'info');
            
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
            registerTcInput.value = tcNumber;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt" aria-hidden="true"></i> Sign In';
        loginButton.disabled = false;
    }
}

// Register new patient
async function register() {
    const tcNumber = registerTcInput.value.trim();
    const name = nameInput.value.trim();
    const dob = dobInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    
    // Input validation
    if (!tcNumber || tcNumber.length !== 11 || isNaN(tcNumber)) {
        showNotification('Please enter a valid 11-digit ID number', 'error');
        return;
    }
    
    if (!name) {
        showNotification('Please enter your full name', 'error');
        return;
    }
    
    if (!dob) {
        showNotification('Please enter your date of birth', 'error');
        return;
    }
    
    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        // Show loading state
        registerButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Registering...';
        registerButton.disabled = true;
        
        const patientData = {
            tc_number: tcNumber,
            name: name,
            date_of_birth: dob,
            phone: phone,
            email: email,
            gender: "" // Boş olarak gönderelim, gerekirse form güncellenebilir
        };
        
        // Log for debugging
        console.log('Registering patient:', patientData);
        
        let result;
        
        if (USE_MOCK_DATA) {
            // Mock veri kullan
            console.log('Using mock data for registration');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Add to mock users
            MOCK_USERS[tcNumber] = {
                name: name,
                email: email,
                phone: phone
            };
            
            // Save to localStorage
            try {
                localStorage.setItem('mockUsers', JSON.stringify(MOCK_USERS));
                console.log('Saved users to localStorage', MOCK_USERS);
            } catch (e) {
                console.error('Error saving users to localStorage:', e);
            }
            
            result = {
                success: true,
                message: 'Registration successful',
                patient: {
                    tc_number: tcNumber,
                    name: name,
                    email: email,
                    phone: phone
                }
            };
        } else {
            // API URL'yi göster
            if (DEBUG) {
                console.log('API URL:', `${API_URL}/patient/register`);
            }
            
            // API'ye gönder
            const response = await fetch(`${API_URL}/patient/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patientData)
            });
            
            if (!response.ok) {
                if (DEBUG) {
                    console.error('API Error:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            }
            
            result = await response.json();
        }
        
        // Log response for debugging
        console.log('Registration response:', result);
        
        // Reset button state
        registerButton.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Register';
        registerButton.disabled = false;
        
        if (result.success) {
            // Registration successful
            showNotification('Registration successful! You can now sign in.', 'success');
            
            // Automatically populate login field and switch to login view
            tcInput.value = tcNumber;
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            
            // Focus on the login button
            loginButton.focus();
        } else {
            // Registration failed
            showNotification(result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
        registerButton.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Register';
        registerButton.disabled = false;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
} 
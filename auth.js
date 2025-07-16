// User Management System
const users = JSON.parse(localStorage.getItem('proplanner_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('proplanner_currentUser')) || null;
const REMEMBER_ME_KEY = 'proplanner_rememberMe';
const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Initialize auth system
function initAuth() {
  checkAutoLogin();
  setupLoginPage();
  setupLogout();
  updateUserProfile();
}

function checkAutoLogin() {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  const lastLogin = localStorage.getItem('proplanner_lastLogin');
  
  if (rememberMe && currentUser && lastLogin) {
    const timeSinceLastLogin = Date.now() - parseInt(lastLogin);
    
    if (timeSinceLastLogin < SESSION_TIMEOUT) {
      if (window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
      } else {
        updateUserProfile();
      }
      return;
    }
  }
  
  // If we get here, either not remembering or session expired
  if (!window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }
}

function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerLink = document.getElementById('registerLink');
  const loginLink = document.getElementById('loginLink');
  const registerBtn = document.getElementById('registerBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember').checked;
      
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
      loginUser(email, password);
    });
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirm').value;
      
      if (password !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
      }
      
      if (!document.getElementById('agreeTerms').checked) {
        showToast('You must agree to the terms!', 'error');
        return;
      }
      
      registerUser(name, email, password);
    });
  }

  if (registerLink && loginLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginForm').classList.add('hidden');
      document.getElementById('registerForm').classList.remove('hidden');
    });
    
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('registerForm').classList.add('hidden');
      document.getElementById('loginForm').classList.remove('hidden');
    });
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
}

function updateUserProfile() {
  if (currentUser) {
    const avatar = document.getElementById('userAvatar') || document.getElementById('adminProfile')?.querySelector('img');
    const name = document.getElementById('userName') || document.getElementById('adminName');
    
    if (avatar) {
      avatar.src = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4361ee&color=fff`;
    }
    
    if (name) {
      name.textContent = currentUser.name;
    }
  }
}

function loginUser(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    currentUser = user;
    localStorage.setItem('proplanner_currentUser', JSON.stringify(user));
    localStorage.setItem('proplanner_lastLogin', Date.now().toString());
    
    // Record login activity
    user.lastLogin = new Date().toISOString();
    user.activities = user.activities || [];
    user.activities.push({
      type: 'login',
      date: new Date().toISOString(),
      method: 'email'
    });
    updateUser(user);
    
    window.location.href = 'index.html';
  } else {
    showToast('Invalid email or password!', 'error');
  }
}

function registerUser(name, email, password) {
  if (users.some(u => u.email === email)) {
    showToast('Email already registered!', 'error');
    return;
  }
  
  const newUser = {
    id: generateId(),
    name,
    email,
    password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4361ee&color=fff`,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    activities: []
  };
  
  users.push(newUser);
  localStorage.setItem('proplanner_users', JSON.stringify(users));
  currentUser = newUser;
  localStorage.setItem('proplanner_currentUser', JSON.stringify(newUser));
  localStorage.setItem(REMEMBER_ME_KEY, 'true');
  localStorage.setItem('proplanner_lastLogin', Date.now().toString());
  
  showToast('Registration successful!', 'success');
  window.location.href = 'index.html';
}

function logoutUser() {
  if (currentUser) {
    currentUser.activities.push({
      type: 'logout',
      date: new Date().toISOString()
    });
    updateUser(currentUser);
  }
  
  currentUser = null;
  localStorage.removeItem('proplanner_currentUser');
  localStorage.removeItem('proplanner_lastLogin');
  localStorage.removeItem(REMEMBER_ME_KEY);
  window.location.href = 'login.html';
}

function updateUser(updatedUser) {
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem('proplanner_users', JSON.stringify(users));
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initAuth);
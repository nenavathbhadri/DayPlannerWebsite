// DOM Elements
const planner = document.getElementById('planner');
const datePicker = document.getElementById('datePicker');
const exportBtn = document.getElementById('exportBtn');
const printBtn = document.getElementById('printBtn');
const clearBtn = document.getElementById('clearBtn');
const progressValue = document.getElementById('progressValue');
const progressBarFill = document.getElementById('progressBarFill');
const quoteBox = document.getElementById('quote');
const currentDateDisplay = document.getElementById('currentDate');
const completedTasksEl = document.getElementById('completedTasks');
const totalTasksEl = document.getElementById('totalTasks');
const currentYearEl = document.getElementById('currentYear');

// Configuration
const WORK_HOURS = {
  start: 7, // 7 AM
  end: 21   // 9 PM
};
const HOURS = Array.from({ length: WORK_HOURS.end - WORK_HOURS.start + 1 }, (_, i) => i + WORK_HOURS.start);

// Motivational Quotes
const QUOTES = [
  "Productivity is being able to do things that you were never able to do before.",
  "Your time is limited, so don't waste it living someone else's life.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "Either you run the day or the day runs you.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
  "Discipline is choosing between what you want now and what you want most.",
  "The secret of getting ahead is getting started.",
  "You don't have to see the whole staircase, just take the first step.",
  "The way to get started is to quit talking and begin doing."
];

// Initialize App
function initApp() {
  // Set current year in footer
  currentYearEl.textContent = new Date().getFullYear();
  
  // Load random quote
  loadRandomQuote();
  
  // Initialize clock
  initClock();
  
  // Set up date picker
  setupDatePicker();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load today's planner by default
  loadPlannerForDate(new Date());
}

function loadRandomQuote() {
  quoteBox.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

function initClock() {
  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    document.getElementById('clock').textContent = timeString;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

function setupDatePicker() {
  // Allow selection of any past or future date
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 1); // Allow dates up to 1 year in the past
  
  datePicker.min = formatDateForInput(minDate);
  datePicker.max = formatDateForInput(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));
  datePicker.value = formatDateForInput(today);
}

function formatDateForInput(date) {
  return date.toISOString().split('T')[0];
}

function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function setupEventListeners() {
  datePicker.addEventListener('change', (e) => {
    const selectedDate = new Date(e.target.value);
    loadPlannerForDate(selectedDate);
  });
  
  exportBtn.addEventListener('click', exportToPDF);
  printBtn.addEventListener('click', printPlanner);
  clearBtn.addEventListener('click', confirmClearDay);
}

function loadPlannerForDate(date) {
  const dateKey = formatDateForInput(date);
  currentDateDisplay.textContent = formatDateForDisplay(dateKey);
  
  generatePlannerGrid(dateKey);
  updateProgressStats(dateKey);
}

function generatePlannerGrid(dateKey) {
  planner.innerHTML = '';
  
  const currentDate = new Date();
  const selectedDate = new Date(dateKey);
  const isToday = isSameDay(selectedDate, currentDate);
  const isPastDate = selectedDate < currentDate && !isToday;
  
  HOURS.forEach(hour => {
    const row = document.createElement('div');
    row.className = 'time-block';
    
    // Time display
    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.textContent = formatHour(hour);
    
    // Task input
    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.className = 'task';
    taskInput.placeholder = 'What are you working on?';
    taskInput.value = localStorage.getItem(`${currentUser.id}-${dateKey}-task-${hour}`) || '';
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = localStorage.getItem(`${currentUser.id}-${dateKey}-check-${hour}`) === 'true';
    
    if (checkbox.checked) {
      taskInput.classList.add('completed-task');
    }
    
    checkbox.addEventListener('change', () => {
      localStorage.setItem(`${currentUser.id}-${dateKey}-check-${hour}`, checkbox.checked);
      taskInput.classList.toggle('completed-task', checkbox.checked);
      updateProgressStats(dateKey);
      recordActivity('task-completed', { hour, task: taskInput.value, completed: checkbox.checked });
    });
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary save-btn';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    
    saveBtn.addEventListener('click', () => {
      localStorage.setItem(`${currentUser.id}-${dateKey}-task-${hour}`, taskInput.value);
      updateProgressStats(dateKey);
      showToast('Task saved successfully!');
      if (taskInput.value.trim()) {
        recordActivity('task-created', { hour, task: taskInput.value });
      }
    });
    
    // Add time state classes
    if (isToday) {
      const currentHour = currentDate.getHours();
      if (hour < currentHour) {
        row.classList.add('past');
      } else if (hour === currentHour) {
        row.classList.add('present');
      } else {
        row.classList.add('future');
      }
    } else if (isPastDate) {
      row.classList.add('past-date');
    }
    
    // Append elements to row
    row.appendChild(timeEl);
    row.appendChild(taskInput);
    row.appendChild(checkbox);
    row.appendChild(saveBtn);
    
    planner.appendChild(row);
  });
}

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function updateProgressStats(dateKey) {
  let completedCount = 0;
  let filledCount = 0;
  
  HOURS.forEach(hour => {
    const task = localStorage.getItem(`${currentUser.id}-${dateKey}-task-${hour}`);
    const isChecked = localStorage.getItem(`${currentUser.id}-${dateKey}-check-${hour}`) === 'true';
    
    if (task && task.trim()) {
      filledCount++;
      if (isChecked) completedCount++;
    }
  });
  
  const totalTasks = HOURS.length;
  const completionPercentage = Math.round((filledCount / totalTasks) * 100);
  
  progressValue.textContent = `${completionPercentage}%`;
  progressBarFill.style.width = `${completionPercentage}%`;
  completedTasksEl.textContent = completedCount;
  totalTasksEl.textContent = filledCount;
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const dateKey = datePicker.value;
  const formattedDate = formatDateForDisplay(dateKey);
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(40, 53, 147);
  doc.text(`ProPlanner - ${formattedDate}`, 105, 20, { align: 'center' });
  doc.text(`User: ${currentUser.name}`, 105, 30, { align: 'center' });
  
  // Add content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  let y = 40;
  let hasTasks = false;
  
  HOURS.forEach(hour => {
    const task = localStorage.getItem(`${currentUser.id}-${dateKey}-task-${hour}`);
    const isChecked = localStorage.getItem(`${currentUser.id}-${dateKey}-check-${hour}`) === 'true';
    
    if (task) {
      hasTasks = true;
      doc.setFont('helvetica', 'bold');
      doc.text(`${formatHour(hour)}:`, 20, y);
      doc.setFont('helvetica', 'normal');
      
      // Split long tasks into multiple lines
      const splitText = doc.splitTextToSize(task, 160);
      doc.text(splitText, 40, y);
      
      // Add checkbox
      doc.rect(180, y - 4, 5, 5, isChecked ? 'F' : 'S');
      
      y += splitText.length * 7 + 5;
      
      // Add new page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
  });
  
  if (!hasTasks) {
    doc.text('No tasks planned for this day.', 20, y);
  }
  
  // Save the PDF
  doc.save(`ProPlanner_${currentUser.name}_${dateKey}.pdf`);
  showToast('PDF exported successfully!');
  recordActivity('export-pdf', { date: dateKey });
}

function printPlanner() {
  const originalTitle = document.title;
  document.title = `ProPlanner - ${currentUser.name} - ${formatDateForDisplay(datePicker.value)}`;
  window.print();
  document.title = originalTitle;
  recordActivity('print-planner', { date: datePicker.value });
}

function confirmClearDay() {
  if (confirm('Are you sure you want to clear all tasks for this day? This cannot be undone.')) {
    clearDay();
  }
}

function clearDay() {
  const dateKey = datePicker.value;
  
  HOURS.forEach(hour => {
    localStorage.removeItem(`${currentUser.id}-${dateKey}-task-${hour}`);
    localStorage.removeItem(`${currentUser.id}-${dateKey}-check-${hour}`);
  });
  
  loadPlannerForDate(new Date(dateKey));
  showToast('Day cleared successfully!');
  recordActivity('clear-day', { date: dateKey });
}

function recordActivity(type, data = {}) {
  if (!currentUser) return;
  
  const users = JSON.parse(localStorage.getItem('proplanner_users')) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex !== -1) {
    users[userIndex].activities = users[userIndex].activities || [];
    users[userIndex].activities.push({
      type,
      date: new Date().toISOString(),
      data
    });
    
    localStorage.setItem('proplanner_users', JSON.stringify(users));
  }
}

document.addEventListener('DOMContentLoaded', initApp);
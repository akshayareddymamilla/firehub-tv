// ==========================================================================
// FireHub TV — Spatial D-Pad Navigation Engine & Dashboard Logic
// ==========================================================================

// 1. Clock & Date Live Update Engine
function updateClock() {
  const now = new Date();
  
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const timeEl = document.getElementById('currentTime');
  if (timeEl) {
    timeEl.innerHTML = `${hours}:${minutes}<span class="seconds">:${seconds} ${ampm}</span>`;
  }

  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

setInterval(updateClock, 1000);
updateClock();


// ==========================================================================
// 2. 10-Foot Spatial D-Pad Navigation Engine
// ==========================================================================

// Define 2D Matrix of focusable TV elements:
// Row 0: [ Weather, Tasks, Notes ]
// Row 1: [ AWS Bedrock Briefing Banner ]
const navGrid = [
  ['card-weather', 'card-tasks', 'card-notes'],
  ['card-briefing']
];

let currentRow = 0;
let currentCol = 0;

function updateFocus() {
  // Remove focused styling from all elements
  document.querySelectorAll('.focusable').forEach(el => {
    el.classList.remove('focused');
  });

  // Clamp rows & columns
  if (currentRow < 0) currentRow = 0;
  if (currentRow >= navGrid.length) currentRow = navGrid.length - 1;

  const rowItems = navGrid[currentRow];
  if (currentCol < 0) currentCol = 0;
  if (currentCol >= rowItems.length) currentCol = rowItems.length - 1;

  const targetId = navGrid[currentRow][currentCol];
  const targetEl = document.getElementById(targetId);

  if (targetEl) {
    targetEl.classList.add('focused');
    targetEl.focus();

    // Haptic / Visual Flash
    targetEl.style.transition = 'all 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)';
  }
}

// Global TV Remote Key Listener
window.addEventListener('keydown', (e) => {
  // Prevent default scroll behavior on TV screens
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  switch (e.key) {
    case 'ArrowUp':
      moveUp();
      break;
    case 'ArrowDown':
      moveDown();
      break;
    case 'ArrowLeft':
      moveLeft();
      break;
    case 'ArrowRight':
      moveRight();
      break;
    case 'Enter':
    case ' ':
      handleSelect();
      break;
    case 'Escape':
    case 'Backspace':
      handleBack();
      break;
  }
});

function moveUp() {
  if (currentRow > 0) {
    currentRow--;
    // Map column from single banner back to center card
    if (currentCol >= navGrid[currentRow].length) {
      currentCol = 1;
    }
    updateFocus();
  }
}

function moveDown() {
  if (currentRow < navGrid.length - 1) {
    currentRow++;
    currentCol = 0; // Briefing spans full width
    updateFocus();
  }
}

function moveLeft() {
  if (currentCol > 0) {
    currentCol--;
    updateFocus();
  }
}

function moveRight() {
  if (currentCol < navGrid[currentRow].length - 1) {
    currentCol++;
    updateFocus();
  }
}

function handleBack() {
  // Reset focus to top-left
  currentRow = 0;
  currentCol = 0;
  updateFocus();
}


// ==========================================================================
// 3. Interactive Card Actions on "SELECT / ENTER"
// ==========================================================================

// Sample rotating family notes
const sampleNotes = [
  {
    quote: '"Don\'t forget: Groceries arriving around 4:30 PM. Front gate code is updated to #2026."',
    author: '— Pinned by Mom • 2h ago',
    tags: ['#Home', '#Deliveries']
  },
  {
    quote: '"Dinner reservations at 7:00 PM for Dad\'s celebration. Casual dress code!"',
    author: '— Pinned by Maya • 4h ago',
    tags: ['#Family', '#Dinner']
  },
  {
    quote: '"High speed internet technician arriving tomorrow morning between 9 AM and 11 AM."',
    author: '— Pinned by Home Hub • 1d ago',
    tags: ['#Utilities', '#Notice']
  }
];
let currentNoteIndex = 0;

// Sample AI Bedrock Briefings
const sampleBriefings = [
  '"Good morning! Optimal conditions today for outdoor focus before 3 PM. Remember to review your project roadmap and take scheduled rest intervals."',
  '"Midday boost: High air quality index currently. Perfect time for a 15-minute screen break or brisk walk."',
  '"Evening reflection: Great progress on today\'s objectives. Unwind with ambient lighting to prepare for restful sleep."'
];
let currentBriefingIndex = 0;

// Toggle temperature units
let isFahrenheit = true;

function handleSelect() {
  const currentId = navGrid[currentRow][currentCol];

  if (currentId === 'card-weather') {
    // Action 1: Toggle °F and °C
    isFahrenheit = !isFahrenheit;
    const tempEl = document.getElementById('weatherTemp');
    if (isFahrenheit) {
      tempEl.textContent = '72°F';
    } else {
      tempEl.textContent = '22°C';
    }
    showToast(`Switched weather display to ${isFahrenheit ? 'Fahrenheit' : 'Celsius'}`);

  } else if (currentId === 'card-tasks') {
    // Action 2: Cycle and toggle uncompleted tasks
    const uncompleted = document.querySelector('.task-item:not(.completed)');
    if (uncompleted) {
      uncompleted.classList.add('completed');
      uncompleted.querySelector('.check-box').textContent = '✓';
    } else {
      // Reset all tasks if all completed
      document.querySelectorAll('.task-item').forEach((item, idx) => {
        if (idx === 2) {
          item.classList.remove('completed');
          item.querySelector('.check-box').textContent = '○';
        }
      });
    }

    const completedCount = document.querySelectorAll('.task-item.completed').length;
    const totalCount = document.querySelectorAll('.task-item').length;
    document.getElementById('taskCount').textContent = `${completedCount} of ${totalCount} Completed`;
    showToast(`Task list updated: ${completedCount}/${totalCount} completed`);

  } else if (currentId === 'card-notes') {
    // Action 3: Cycle notes
    currentNoteIndex = (currentNoteIndex + 1) % sampleNotes.length;
    const note = sampleNotes[currentNoteIndex];
    document.querySelector('.note-quote').textContent = note.quote;
    document.querySelector('.note-author').innerHTML = note.author;
    showToast('Next family bulletin displayed');

  } else if (currentId === 'card-briefing') {
    // Action 4: Refresh Bedrock AI Briefing
    currentBriefingIndex = (currentBriefingIndex + 1) % sampleBriefings.length;
    document.getElementById('briefingText').textContent = sampleBriefings[currentBriefingIndex];
    showToast('✨ Fresh AWS Bedrock Briefing generated');
  }
}


// ==========================================================================
// 4. Virtual Remote Simulator Click Bindings
// ==========================================================================

document.getElementById('btnUp')?.addEventListener('click', moveUp);
document.getElementById('btnDown')?.addEventListener('click', moveDown);
document.getElementById('btnLeft')?.addEventListener('click', moveLeft);
document.getElementById('btnRight')?.addEventListener('click', moveRight);
document.getElementById('btnSelect')?.addEventListener('click', handleSelect);
document.getElementById('btnBack')?.addEventListener('click', handleBack);
document.getElementById('btnHome')?.addEventListener('click', () => {
  currentRow = 0;
  currentCol = 0;
  updateFocus();
});

// Toggle Remote Minimization
const remoteSimulator = document.getElementById('remoteSimulator');
const closeRemoteBtn = document.getElementById('closeRemoteBtn');
const remoteToggleBtn = document.getElementById('remoteToggleBtn');

closeRemoteBtn?.addEventListener('click', () => {
  remoteSimulator.classList.add('minimized');
});

remoteToggleBtn?.addEventListener('click', () => {
  remoteSimulator.classList.toggle('minimized');
});


// Helper Toast Notification
function showToast(msg) {
  let toast = document.getElementById('tvToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tvToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '8vh';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0, 168, 225, 0.95)';
    toast.style.color = '#000';
    toast.style.fontWeight = '800';
    toast.style.fontSize = '1.1rem';
    toast.style.padding = '10px 24px';
    toast.style.borderRadius = '30px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 10px 30px rgba(0, 168, 225, 0.5)';
    toast.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 2000);
}

// Initialize focus on the first card on load
window.addEventListener('DOMContentLoaded', () => {
  updateFocus();
});

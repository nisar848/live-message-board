// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// Firebase configuration (replace with your actual configuration)
const firebaseConfig = {
  apiKey: "AIzaSyD4EBkvYoXJ_pY6wrvvo7wD7CuNuygRHgY",
  authDomain: "live-message-board.firebaseapp.com",
  projectId: "live-message-board",
  storageBucket: "live-message-board.firebasestorage.app",
  messagingSenderId: "465980009336",
  appId: "1:465980009336:web:38b62c2587ded00596b68d",
  measurementId: "G-4KCL1DYY8R"
};

// Initialize Firebase and services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  // FEATURE BUTTONS: Show/hide containers
  const btnClock = document.getElementById('btnClock');
  const btnTimer = document.getElementById('btnTimer');
  const btnStopwatch = document.getElementById('btnStopwatch');
  
  const clockContainer = document.getElementById('clock-container');
  const timerContainer = document.getElementById('timer-container');
  const stopwatchContainer = document.getElementById('stopwatch-container');
  
  btnClock.addEventListener('click', () => {
    clockContainer.style.display = "flex";     // Use "flex" to preserve centering
    timerContainer.style.display = "none";
    stopwatchContainer.style.display = "none";
  });
  
  btnTimer.addEventListener('click', () => {
    clockContainer.style.display = "none";
    timerContainer.style.display = "flex";       // Show timer with flex layout
    stopwatchContainer.style.display = "none";
  });
  
  btnStopwatch.addEventListener('click', () => {
    clockContainer.style.display = "none";
    timerContainer.style.display = "none";
    stopwatchContainer.style.display = "flex";     // Show stopwatch with flex layout
  });
  
  // LIVE CLOCK: Update every second using user's local time and configurable format
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Read the selected time format from the dropdown
    const timeFormat = document.getElementById('timeFormat').value;
    let period = '';
    if (timeFormat === '12') {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;
      if (hours === 0) {
        hours = 12;
      }
    }
    const hoursString = String(hours).padStart(2, '0');
    const minutesString = String(minutes).padStart(2, '0');
    const secondsString = String(seconds).padStart(2, '0');
    const timeString = `${hoursString}:${minutesString}:${secondsString}${period}`;
    document.getElementById('clock').textContent = timeString;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
  document.getElementById('timeFormat').addEventListener('change', updateClock);
  
  // TIMER: Countdown based on user input
  let timerInterval;
  document.getElementById('startTimer').addEventListener('click', () => {
    const timerInputValue = document.getElementById('timerInput').value;
    let timeLeft = parseInt(timerInputValue, 10);
    const timerDisplay = document.getElementById('timerDisplay');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timerDisplay.textContent = timeLeft;
        timeLeft--;
      } else {
        timerDisplay.textContent = 'Time is up!';
        clearInterval(timerInterval);
      }
    }, 1000);
  });
  
  // STOPWATCH: Count up from zero
  let stopwatchInterval;
  let stopwatchTime = 0;
  const stopwatchDisplay = document.getElementById('stopwatchDisplay');
  
  document.getElementById('startStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
      stopwatchTime++;
      stopwatchDisplay.textContent = stopwatchTime;
    }, 1000);
  });
  
  document.getElementById('stopStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
  });
  
  document.getElementById('resetStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    stopwatchDisplay.textContent = stopwatchTime;
  });
  
  // FULLSCREEN TOGGLE: Switch to/from fullscreen mode
  document.getElementById('fullscreenToggle').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        document.getElementById('fullscreenToggle').textContent = "✕";
      }).catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        document.getElementById('fullscreenToggle').textContent = "⛶";
      }).catch(err => {
        console.error(`Error exiting fullscreen: ${err.message}`);
      });
    }
  });
});

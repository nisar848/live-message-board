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
  // FEATURE BUTTONS: Show/hide containers using "flex" to preserve centering
  const btnClock = document.getElementById('btnClock');
  const btnTimer = document.getElementById('btnTimer');
  const btnStopwatch = document.getElementById('btnStopwatch');
  
  const clockContainer = document.getElementById('clock-container');
  const timerContainer = document.getElementById('timer-container');
  const stopwatchContainer = document.getElementById('stopwatch-container');
  
  btnClock.addEventListener('click', () => {
    clockContainer.style.display = "flex";
    timerContainer.style.display = "none";
    stopwatchContainer.style.display = "none";
  });
  
  btnTimer.addEventListener('click', () => {
    clockContainer.style.display = "none";
    timerContainer.style.display = "flex";
    stopwatchContainer.style.display = "none";
  });
  
  btnStopwatch.addEventListener('click', () => {
    clockContainer.style.display = "none";
    timerContainer.style.display = "none";
    stopwatchContainer.style.display = "flex";
  });
  
  // Helper function to format seconds as HH:MM:SS
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  // Helper function to parse a "HH:MM:SS" string into total seconds
  function parseTime(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length !== 3) {
      return NaN;
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  
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
  
  // TIMER: Countdown based on user-edited value in the input field (HH:MM:SS format)
  let timerInterval;
  document.getElementById('startTimer').addEventListener('click', () => {
    const timeInputStr = document.getElementById('timerDisplay').value;
    let totalSeconds = parseTime(timeInputStr);
    
    if (isNaN(totalSeconds)) {
      alert("Please enter a valid time in HH:MM:SS format.");
      return;
    }
    
    const timerDisplayElem = document.getElementById('timerDisplay');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        timerDisplayElem.value = formatTime(totalSeconds);
        totalSeconds--;
      } else {
        timerDisplayElem.value = "Time is up!";
        clearInterval(timerInterval);
      }
    }, 1000);
  });
  
  // STOPWATCH: Count up from zero and display in HH:MM:SS format
  let stopwatchInterval;
  let stopwatchSeconds = 0;
  const stopwatchDisplay = document.getElementById('stopwatchDisplay');
  
  document.getElementById('startStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
      stopwatchSeconds++;
      stopwatchDisplay.textContent = formatTime(stopwatchSeconds);
    }, 1000);
  });
  
  document.getElementById('stopStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
  });
  
  document.getElementById('resetStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchSeconds = 0;
    stopwatchDisplay.textContent = formatTime(stopwatchSeconds);
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
  
  // QR Code Generation for Message Submission
  // This generates a QR code in the "qr-code" div that encodes a URL for message submission.
const qrCodeContainer = document.getElementById('qr-code');
const submissionUrl = "https://nisar848.github.io/live-message-board/submit.html"; 
new QRCode(qrCodeContainer, {
    text: submissionUrl,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});
});

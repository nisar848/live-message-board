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
  // LIVE CLOCK: Update every second using user's local time
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock').textContent = currentTime;
  }
  
  // Call immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);

  // TIMER: Countdown based on user input
  let timerInterval; // Holds the timer interval
  document.getElementById('startTimer').addEventListener('click', () => {
    const timerInputValue = document.getElementById('timerInput').value;
    let timeLeft = parseInt(timerInputValue, 10);
    const timerDisplay = document.getElementById('timerDisplay');

    // Clear any existing timer to avoid duplicates
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
  let stopwatchInterval; // Holds the stopwatch interval
  let stopwatchTime = 0;   // Elapsed seconds
  const stopwatchDisplay = document.getElementById('stopwatchDisplay');

  // Start the stopwatch
  document.getElementById('startStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
      stopwatchTime++;
      stopwatchDisplay.textContent = stopwatchTime;
    }, 1000);
  });

  // Stop the stopwatch
  document.getElementById('stopStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
  });

  // Reset the stopwatch
  document.getElementById('resetStopwatch').addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    stopwatchDisplay.textContent = stopwatchTime;
  });
});

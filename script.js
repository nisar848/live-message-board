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

// Clock Functionality
function updateClock() {
  const clockElement = document.getElementById('clock');
  const now = new Date();
  // Format hours, minutes, and seconds
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock(); // initial call

// Timer Functionality
let timerInterval;

document.getElementById('startTimer').addEventListener('click', function() {
  const input = document.getElementById('timerInput').value;
  let timeLeft = parseInt(input, 10);
  const display = document.getElementById('timerDisplay');
  clearInterval(timerInterval); // Clear any previous timer

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      display.textContent = timeLeft;
      timeLeft--;
    } else {
      display.textContent = 'Time is up!';
      clearInterval(timerInterval);
    }
  }, 1000);
});

// Stopwatch Functionality
let stopwatchInterval;
let stopwatchTime = 0;

const stopwatchDisplay = document.getElementById('stopwatchDisplay');

document.getElementById('startStopwatch').addEventListener('click', function() {
  clearInterval(stopwatchInterval);
  stopwatchInterval = setInterval(() => {
    stopwatchTime++;
    stopwatchDisplay.textContent = stopwatchTime;
  }, 1000);
});

document.getElementById('stopStopwatch').addEventListener('click', function() {
  clearInterval(stopwatchInterval);
});

document.getElementById('resetStopwatch').addEventListener('click', function() {
  clearInterval(stopwatchInterval);
  stopwatchTime = 0;
  stopwatchDisplay.textContent = stopwatchTime;
});

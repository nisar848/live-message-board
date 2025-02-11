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

let timerInterval; // Variable to store the timer interval

// Attach an event listener to the "Start Timer" button
document.getElementById('startTimer').addEventListener('click', function () {
  // Get the input value and convert it to an integer
  const timerInputValue = document.getElementById('timerInput').value;
  let timeLeft = parseInt(timerInputValue, 10);

  // Get the element that displays the timer countdown
  const timerDisplay = document.getElementById('timerDisplay');

  // Clear any previous timer to avoid multiple intervals running at once
  clearInterval(timerInterval);

  // Start a new interval to count down every second (1000ms)
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


// STOPWATCH CODE
let stopwatchInterval; // Variable to store the stopwatch interval
let stopwatchTime = 0;   // Variable to keep track of elapsed seconds

// Get the display element for the stopwatch
const stopwatchDisplay = document.getElementById('stopwatchDisplay');

// Attach event listener to the "Start" button for the stopwatch
document.getElementById('startStopwatch').addEventListener('click', function () {
  // Clear any existing interval to prevent multiple intervals running simultaneously
  clearInterval(stopwatchInterval);
  stopwatchInterval = setInterval(() => {
    stopwatchTime++;
    stopwatchDisplay.textContent = stopwatchTime;
  }, 1000);
});

// Attach event listener to the "Stop" button
document.getElementById('stopStopwatch').addEventListener('click', function () {
  clearInterval(stopwatchInterval);
});

// Attach event listener to the "Reset" button
document.getElementById('resetStopwatch').addEventListener('click', function () {
  clearInterval(stopwatchInterval);
  stopwatchTime = 0;
  stopwatchDisplay.textContent = stopwatchTime;
});

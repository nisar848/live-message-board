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
  // LIVE CLOCK: Update every second using user's local time and configurable format
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Read the selected time format from the dropdown
    const timeFormat = document.getElementById('timeFormat').value;
    
    let period = '';
    
    // If the user selects 12-Hour format, convert the hours and determine AM/PM
    if (timeFormat === '12') {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12; // Convert 24-hour time to 12-hour format
      if (hours === 0) { // If hours is 0, it should be 12 for 12-hour format
        hours = 12;
      }
    }
    
    // Format each unit to always have two digits
    const hoursString = String(hours).padStart(2, '0');
    const minutesString = String(minutes).padStart(2, '0');
    const secondsString = String(seconds).padStart(2, '0');
    
    // Combine into the final time string
    const timeString = `${hoursString}:${minutesString}:${secondsString}${period}`;
    
    // Update the clock element with the formatted time
    document.getElementById('clock').textContent = timeString;
  }
  
  // Update the clock immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
  
  // Update the clock immediately when the dropdown value changes
  document.getElementById('timeFormat').addEventListener('change', updateClock);
  
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
  
  // FULLSCREEN TOGGLE: Allows users to switch to and from fullscreen mode
  document.getElementById('fullscreenToggle').addEventListener('click', () => {
    // Check if the document is already in fullscreen mode
    if (!document.fullscreenElement) {
      // Request fullscreen on the entire page
      document.documentElement.requestFullscreen().then(() => {
        // Update the button text to indicate the new action
        document.getElementById('fullscreenToggle').textContent = "Exit Fullscreen";
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      // If already fullscreen, exit fullscreen mode
      document.exitFullscreen().then(() => {
        // Reset the button text
        document.getElementById('fullscreenToggle').textContent = "Go Fullscreen";
      }).catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message}`);
      });
    }
  });
});

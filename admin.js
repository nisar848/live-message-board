// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// Your Firebase configuration (replace with your actual configuration)
const firebaseConfig = {
  apiKey: "AIzaSyD4EBkvYoXJ_pY6wrvvo7wD7CuNuygRHgY",
  authDomain: "live-message-board.firebaseapp.com",
  projectId: "live-message-board",
  storageBucket: "live-message-board.firebasestorage.app",
  messagingSenderId: "465980009336",
  appId: "1:465980009336:web:38b62c2587ded00596b68d",
  measurementId: "G-4KCL1DYY8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Ensure there's a reCAPTCHA container. If not in your HTML, create one.
if (!document.getElementById('recaptcha-container')) {
  const recaptchaDiv = document.createElement('div');
  recaptchaDiv.id = 'recaptcha-container';
  document.body.appendChild(recaptchaDiv);
}

// Set up an invisible reCAPTCHA verifier
const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
  size: 'invisible',
  callback: (response) => {
    // reCAPTCHA solved - allow sign in with phone number.
    console.log('reCAPTCHA solved');
  }
}, auth);

// ADMIN LOGIN USING PHONE AUTHENTICATION
const adminLoginForm = document.getElementById('adminLoginForm');
adminLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const phoneNumber = document.getElementById('adminPhone').value;
  // Note: Make sure the phone number includes the country code (e.g., +1234567890)
  signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
    .then((confirmationResult) => {
      // SMS sent. Ask admin to enter the verification code.
      const verificationCode = window.prompt('Enter the verification code you received via SMS:');
      return confirmationResult.confirm(verificationCode);
    })
    .then((result) => {
      // Admin signed in successfully.
      console.log('Admin signed in:', result.user);
      // Hide the login form and display the admin panel.
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      // Load pending messages for moderation.
      loadPendingMessages();
    })
    .catch((error) => {
      console.error('Error during phone authentication:', error);
      alert('Authentication failed: ' + error.message);
    });
});

// FUNCTION TO LOAD PENDING MESSAGES
function loadPendingMessages() {
  const messagesRef = ref(database, 'messages');
  onValue(messagesRef, (snapshot) => {
    const messages = snapshot.val();
    const pendingMessagesDiv = document.getElementById('pendingMessages');
    // Clear any existing content.
    pendingMessagesDiv.innerHTML = '';
    // Loop through all messages.
    for (let key in messages) {
      if (messages.hasOwnProperty(key)) {
        const message = messages[key];
        // Check if the message is pending approval (approved field is false or missing).
        if (!message.approved) {
          // Create a container for this message.
          const messageDiv = document.createElement('div');
          messageDiv.textContent = message.text;
          
          // Create an Approve button.
          const approveButton = document.createElement('button');
          approveButton.textContent = 'Approve';
          approveButton.addEventListener('click', () => {
            // Update the message in the database to mark it as approved.
            update(ref(database, 'messages/' + key), { approved: true })
              .then(() => console.log('Message approved:', key))
              .catch((error) => console.error('Error approving message:', error));
          });
          
          // Create a Deny button to delete the message.
          const denyButton = document.createElement('button');
          denyButton.textContent = 'Deny';
          denyButton.addEventListener('click', () => {
            remove(ref(database, 'messages/' + key))
              .then(() => console.log('Message denied and removed:', key))
              .catch((error) => console.error('Error deleting message:', error));
          });
          
          // Append the buttons to the message container.
          messageDiv.appendChild(approveButton);
          messageDiv.appendChild(denyButton);
          
          // Append the message container to the pending messages div.
          pendingMessagesDiv.appendChild(messageDiv);
        }
      }
    }
  });
}

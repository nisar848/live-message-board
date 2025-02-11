// Import Firebase compat modules so that the global firebase namespace is used
import firebase from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/11.8.0/firebase-database-compat.js";

// Your Firebase configuration (replace with your actual configuration)
var firebaseConfig = {
  apiKey: "AIzaSyD4EBkvYoXJ_pY6wrvvo7wD7CuNuygRHgY",
  authDomain: "live-message-board.firebaseapp.com",
  projectId: "live-message-board",
  storageBucket: "live-message-board.firebasestorage.app",
  messagingSenderId: "465980009336",
  appId: "1:465980009336:web:38b62c2587ded00596b68d",
  measurementId: "G-4KCL1DYY8R"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Sign-out functionality
document.getElementById("signOutButton").addEventListener("click", function() {
  firebase.auth().signOut().then(function() {
    window.location.href = "admin.html"; // Redirect back to login
  }).catch(function(error) {
    console.error("Sign out error:", error);
  });
});

// Function to load pending messages from the "messages" node
function loadPendingMessages() {
  const messagesRef = firebase.database().ref("messages");
  messagesRef.on("value", function(snapshot) {
    const messages = snapshot.val();
    const pendingDiv = document.getElementById("pendingMessages");
    pendingDiv.innerHTML = ""; // Clear existing content
    for (let key in messages) {
      if (messages.hasOwnProperty(key)) {
        const message = messages[key];
        // Only display messages that have not been approved
        if (!message.approved) {
          const messageDiv = document.createElement("div");
          messageDiv.innerHTML = `<span>${message.text}</span>`;
          
          // Create Approve button
          const approveBtn = document.createElement("button");
          approveBtn.textContent = "Approve";
          approveBtn.onclick = function() {
            firebase.database().ref("messages/" + key).update({ approved: true })
              .then(() => console.log("Message approved:", key))
              .catch((error) => console.error("Error approving message:", error));
          };
          
          // Create Deny button
          const denyBtn = document.createElement("button");
          denyBtn.textContent = "Deny";
          denyBtn.onclick = function() {
            firebase.database().ref("messages/" + key).remove()
              .then(() => console.log("Message denied and removed:", key))
              .catch((error) => console.error("Error deleting message:", error));
          };
          
          messageDiv.appendChild(approveBtn);
          messageDiv.appendChild(denyBtn);
          pendingDiv.appendChild(messageDiv);
        }
      }
    }
  });
}

// Listen for auth state changes
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    console.log("Admin is signed in:", user);
    loadPendingMessages();
  } else {
    // If not signed in, redirect to the login page
    window.location.href = "admin.html";
  }
});

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Load the service account key securely
const serviceAccount =
require("./live-message-board-firebase-adminsdk-fbsvc-c426b9cb18.json");

// Initialize Firebase Admin SDK with credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com",
});

// Define a reference to store the
// flag indicating if the first admin has been set
const adminFlagRef = admin.database().ref("admin/firstAdminSet");

/**
 * Triggered when a new user is created.
 * If the user signed in via Email/Password and no admin has been set yet,
 * assign the custom claim "admin": true to that user and set the flag.
 */
exports.setFirstAdmin = functions.auth.user().onCreate(async (userRecord) => {
  try {
    // Ensure userRecord exists
    if (!userRecord || !userRecord.providerData) {
      console.error("Invalid user record received.");
      return null;
    }

    // Check if the user signed in with email/password.
    const isEmailUser = userRecord.providerData.some((p) =>
      p.providerId === "password");
    if (!isEmailUser) {
      console.log(`User ${userRecord.uid} did not sign in with email; 
        skipping admin assignment.`);
      return null;
    }

    // Check if an admin is already set
    const snapshot = await adminFlagRef.once("value");
    const firstAdminSet = snapshot.val();

    if (!firstAdminSet) {
      // No admin is set yet, make this user the first admin
      await admin.auth().setCustomUserClaims(userRecord.uid, {admin: true});
      await adminFlagRef.set(true);
      console.log(`✅ First admin claim set for user: ${userRecord.uid}`);
    } else {
      console.log(`⚠️ Admin already set; user 
        ${userRecord.uid} is not automatically an admin.`);
    }
  } catch (error) {
    console.error("❌ Error in setFirstAdmin function:", error);
  }
  return null;
});

/**
 * Scheduled function to reset admin claims every 3 days.
 * This function clears the custom 'admin' claim for all users and resets the
 * 'firstAdminSet' flag so that the next new email user can become admin.
 */
exports.resetAdminClaims = functions.pubsub
    .schedule("0 0 */3 * *") // Runs every 3 days at midnight
    .onRun(async (context) => {
      try {
        let nextPageToken = null;

        do {
        // Fetch users in batches of 1000
          const listUsersResult = await admin.auth().listUsers(1000,
              nextPageToken);
          const updatePromises = listUsersResult.users.map((userRecord) => {
            if (userRecord.customClaims && userRecord.customClaims.admin) {
              return admin.auth().setCustomUserClaims(userRecord.uid, null)
                  .then(() => {
                    console.log(`✅ Removed admin claim from user: 
                      ${userRecord.uid}`);
                  })
                  .catch((error) => {
                    console.error(`❌ Error removing admin claim from user 
                      ${userRecord.uid}:`, error);
                  });
            }
            return Promise.resolve(); // Ensure every map
            // iteration returns a Promise
          });

          await Promise.all(updatePromises);
          nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        // Reset the first admin flag so that the next email user becomes admin
        await adminFlagRef.set(false);
        console.log("✅ Admin claims reset and first admin flag cleared.");
      } catch (error) {
        console.error("❌ Error in resetAdminClaims function:", error);
      }
      return null;
    });

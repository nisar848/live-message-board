const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Admin SDK.
admin.initializeApp();

// Define a reference path in the Realtime Database to store the flag indicating
// that the first admin has been set.
const adminFlagRef = admin.database().ref("admin/firstAdminSet");

/**
 * Triggered when a new user is created.
 * If the user signed in via Email/Password and no admin has been set yet,
 * assign the custom claim "admin": true to that user and set the flag.
 */
exports.setFirstAdmin = functions.auth.user().onCreate((userRecord) => {
  // Check if the user signed in with email/password.
  if (
    !userRecord.providerData ||
    !userRecord.providerData.some((p) => p.providerId === "password")
  ) {
    console.log("User did not sign in with email; skipping admin assignment.");
    return null;
  }

  // Read the admin flag from the database.
  return adminFlagRef.once("value")
      .then((snapshot) => {
        const firstAdminSet = snapshot.val();
        if (!firstAdminSet) {
        // No admin is set yet. Set this user as admin.
          return admin.auth()
              .setCustomUserClaims(userRecord.uid, {admin: true})
              .then(() => adminFlagRef.set(true))
              .then(() => {
                console.log("First admin claim set for user:", userRecord.uid);
                return null;
              })
              .catch((error) => {
                console.error("Error setting admin claim:", error);
                return null;
              });
        } else {
          console.log("Admin already set; user", userRecord.uid,
              "is not automatically admin.");
          return null;
        }
      })
      .catch((error) => {
        console.error("Error reading admin flag:", error);
        return null;
      });
});

/**
 * Scheduled function to reset admin claims every 3 days.
 * This function clears the custom 'admin' claim for all users and resets the
 * 'firstAdminSet' flag so that the next new email user can become admin.
 */
exports.resetAdminClaims = functions.pubsub
    .schedule("0 0 */3 * *") // Every 3 days at midnight.
    .onRun(async (context) => {
      try {
        let nextPageToken;
        do {
        // List users in batches of 1000.
          const listUsersResult = await admin.auth().listUsers(1000,
              nextPageToken);
          const promises = listUsersResult.users.map((userRecord) => {
            if (userRecord.customClaims && userRecord.customClaims.admin) {
              return admin.auth().setCustomUserClaims(userRecord.uid, null)
                  .then(() => {
                    console.log(`Removed admin claim from user: 
                      ${userRecord.uid}`);
                  })
                  .catch((error) => {
                    console.error(`Error removing admin claim from user 
                      ${userRecord.uid}:`, error);
                  });
            } else {
              return Promise.resolve();
            }
          });
          await Promise.all(promises);
          nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        // Reset the first admin flag so that the next
        // new email user becomes admin.
        await adminFlagRef.set(false);
        console.log("Admin claims reset and first admin flag cleared.");
      } catch (error) {
        console.error("Error in resetAdminClaims function:", error);
      }
      return null;
    });

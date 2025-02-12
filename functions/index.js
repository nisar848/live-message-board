const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Load service account key securely from environment variable
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(require("os").homedir(), ".firebase-adminsdk.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Service account key file not found:", serviceAccountPath);
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/",
});

// Reference to track whether an admin has been set
const adminFlagRef = admin.database().ref("admin/firstAdminSet");
const adminsRef = admin.database().ref("admins");

/**
 * When a new user signs up, make them admin if no admin exists.
 */
exports.setFirstAdmin = functions.auth.user.onCreate(async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object received in onCreate trigger:", user);
    return null;
  }

  try {
    const snapshot = await adminFlagRef.once("value");
    const firstAdminSet = snapshot.val();

    if (!firstAdminSet) {
      // No admin is set yet, make this user admin
      await admin.auth().setCustomUserClaims(user.uid, {admin: true});
      await adminsRef.child(user.uid).set({email: user.email ||
        user.phoneNumber});

      // Mark that an admin has been set
      await adminFlagRef.set(true);
      console.log("First admin assigned:", user.uid);
    } else {
      console.log("User is not auto-admin:", user.uid);
    }
  } catch (error) {
    console.error("Error setting first admin:", error);
  }

  return null;
});

/**
 * Function to allow an admin to grant admin privileges to other users.
 */
exports.addAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can add new admins.",
    );
  }

  const {userId} = data;
  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument",
        "User ID is required.");
  }

  try {
    await admin.auth().setCustomUserClaims(userId, {admin: true});
    await adminsRef.child(userId).set(true);
    console.log("Admin added:", userId);
    return {success: true, message: "User granted admin privileges."};
  } catch (error) {
    console.error("Error adding admin:", error);
    throw new functions.https.HttpsError("internal",
        "Could not grant admin privileges.");
  }
});

/**
 * Scheduled function to delete all users and reset environment every 3 days.
 */
exports.resetEnvironment =
functions.pubsub.schedule("every 3 days").onRun(async () => {
  try {
    // Fetch all users
    const listUsersResult = await admin.auth().listUsers();
    const deletePromises = [];

    for (const user of listUsersResult.users) {
      // Remove user
      deletePromises.push(admin.auth().deleteUser(user.uid));
      console.log("Deleted user:", user.uid);
    }

    // Clear the admin list in the database
    await Promise.all(deletePromises);
    await adminsRef.remove();
    await adminFlagRef.set(false);

    console.log("All users deleted. Environment reset.");
  } catch (error) {
    console.error("Error resetting environment:", error);
  }
  return null;
});

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

// References for admin flag and admin users list
const adminFlagRef = admin.database().ref("admin/firstAdminSet");
const adminsRef = admin.database().ref("admins");

/**
 * When a new user signs up, use a transaction to check if an admin exists.
 * If not, atomically mark the flag and set this user as admin.
 */
exports.setFirstAdmin = functions.auth.user.onCreate(async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object received in onCreate trigger:", user);
    return null;
  }

  try {
    // Use a transaction to check and update the admin flag atomically.
    const transactionResult = await adminFlagRef.transaction((currentValue) => {
      if (!currentValue) {
        // If no admin is set, return true to mark that an admin is now set.
        return true;
      }
      // Otherwise, do not modify the flag.
      return currentValue;
    });

    if (transactionResult.committed &&
      transactionResult.snapshot.val() === true) {
      // We successfully marked the flag, so this user becomes the first admin.
      await admin.auth().setCustomUserClaims(user.uid, {admin: true});
      await adminsRef.child(user.uid).set({
        email: user.email || user.phoneNumber,
      });
      console.log("First admin assigned:", user.uid);
    } else {
      console.log("Admin already exists; not setting auto-admin for user:",
          user.uid);
    }
  } catch (error) {
    console.error("Error setting first admin:", error);
  }

  return null;
});

/**
 * Callable function to allow an existing
 * admin to grant admin privileges to another user.
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
    throw new
    functions.https.HttpsError("invalid-argument", "User ID is required.");
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
 * Scheduled function to delete all
 * users and reset the environment every 3 days.
 */
exports.resetEnvironment =
functions.pubsub.schedule("every 3 days").onRun(async () => {
  try {
    // List all users and delete them
    const listUsersResult = await admin.auth().listUsers();
    const deletePromises = listUsersResult.users.map((user) => {
      console.log("Deleting user:", user.uid);
      return admin.auth().deleteUser(user.uid);
    });

    await Promise.all(deletePromises);
    // Reset admin-related flags and data in the database
    await adminsRef.remove();
    await adminFlagRef.set(false);
    console.log("All users deleted. Environment reset.");
  } catch (error) {
    console.error("Error resetting environment:", error);
  }
  return null;
});

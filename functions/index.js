const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/",
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/", // 🔹 Replace with your actual database URL
});

// Reference to track whether an admin has been set
const adminFlagRef = admin.database().ref("admin/firstAdminSet");
const adminsRef = admin.database().ref("admins");

/**
 * When a new user signs up, make them admin if no admin exists.
 */
exports.setFirstAdmin = functions.auth.user().onCreate(async (user) => {
  try {
    const snapshot = await adminFlagRef.once("value");
    const firstAdminSet = snapshot.val();

    if (!firstAdminSet) {
      // No admin is set yet, make this user admin
      await admin.auth().setCustomUserClaims(user.uid, {admin: true});
      await adminsRef.child(user.uid).set({email:
        user.email || user.phoneNumber});

      // Mark that an admin has been set
      await adminFlagRef.set(true);
      console.log("First admin assigned:", user.uid);
    } else {
      console.log("User is not auto-admin:", user.uid);
    }
  } catch (error) {
    console.error("Error setting first admin:", error);
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
});

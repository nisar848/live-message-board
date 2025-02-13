const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using default
// credentials provided in Cloud Functions
admin.initializeApp({
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/",
});

// References to track admin state
const adminFlagRef = admin.database().ref("admin/firstAdminSet");
const adminsRef = admin.database().ref("admins");

/**
 * When a new user signs up, make them admin if no admin exists.
 */
exports.setFirstAdmin = functions.auth.user().onCreate(async (user) => {
  if (!user || !user.uid) {
    console.error("Invalid user object received in onCreate trigger:", user);
    return null;
  }

  try {
    const snapshot = await adminFlagRef.once("value");
    const firstAdminSet = snapshot.val();

    if (!firstAdminSet) {
      // No admin is set yet, so set this user as the first admin.
      await admin.auth().setCustomUserClaims(user.uid, {admin: true});
      await adminsRef.child(user.uid).set({
        email: user.email || user.phoneNumber,
      });
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
 * Callable function to allow an admin to grant admin privileges to other users.
 * Instead of just accepting a UID, this function accepts an identifier
 * (UID, email, or phone number) and attempts to find the user accordingly.
 */
exports.addAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can add new admins.",
    );
  }

  const {identifier} = data;
  if (!identifier) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Identifier is required.",
    );
  }

  let userRecord;
  try {
    // Try to get user by UID.
    try {
      userRecord = await admin.auth().getUser(identifier);
    } catch (err) {
      // If not found by UID, try by email.
      try {
        userRecord = await admin.auth().getUserByEmail(identifier);
      } catch (err2) {
        // If still not found, try by phone number.
        userRecord = await admin.auth().getUserByPhoneNumber(identifier);
      }
    }

    if (!userRecord) {
      throw new functions.https.HttpsError(
          "not-found",
          "No user found with the provided identifier.",
      );
    }

    // Set custom admin claim.
    await admin.auth().setCustomUserClaims(userRecord.uid, {admin: true});
    // Update the admins reference (store either email or phone).
    await adminsRef.child(userRecord.uid).set({
      email: userRecord.email || userRecord.phoneNumber,
    });
    console.log("Admin added:", userRecord.uid);
    return {success: true, message: "User granted admin privileges."};
  } catch (error) {
    console.error("Error adding admin:", error);
    throw new functions.https.HttpsError("internal",
        "Could not grant admin privileges.");
  }
});

/**
 * Scheduled function to delete all users and reset environment every 3 days.
 * The schedule has been updated to a cron expression with explicit timezone.
 */
exports.resetEnvironment = functions.pubsub
    .schedule("0 0 */3 * *")
    .timeZone("UTC")
    .onRun(async () => {
      try {
        const listUsersResult = await admin.auth().listUsers();
        const deletePromises = listUsersResult.users.map((user) => {
          console.log("Deleting user:", user.uid);
          return admin.auth().deleteUser(user.uid);
        });
        await Promise.all(deletePromises);
        await adminsRef.remove();
        await adminFlagRef.set(false);
        console.log("All users deleted. Environment reset.");
      } catch (error) {
        console.error("Error resetting environment:", error);
      }
      return null;
    });

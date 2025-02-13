const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/",
});

// ✅ References
const messagesRef = admin.database().ref("messages");
const pendingMessagesRef = admin.database().ref("pendingMessages");

/**
 * ✅ Submit a Message (Anyone can submit, even without login)
 */
exports.submitMessage = functions.https.onCall(async (data, context) => {
  const {text, name} = data;
  if (!text || text.trim().length === 0) {
    throw new functions.https.HttpsError("invalid-argument",
        "Message text is required.");
  }

  const messageData = {
    name: name && name.trim().length > 0 ? name : "Anonymous",
    text: text.trim(),
    timestamp: Date.now(),
  };

  try {
    await pendingMessagesRef.push(messageData);
    console.log("✅ Message submitted:", messageData);
    return {success: true, message: "Message submitted and awaiting approval."};
  } catch (error) {
    console.error("❌ Error submitting message:", error);
    throw new functions.https.HttpsError("internal",
        "Error submitting message.");
  }
});

/**
 * ✅ Approve Message (Only logged-in users)
 */
exports.approveMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "You must be signed in to approve messages.");
  }

  const {messageId} = data;
  if (!messageId) {
    throw new functions.https.HttpsError("invalid-argument",
        "Message ID is required.");
  }

  try {
    const messageSnapshot =
    await pendingMessagesRef.child(messageId).once("value");
    const messageData = messageSnapshot.val();

    if (!messageData) {
      throw new functions.https.HttpsError("not-found", "Message not found.");
    }

    messageData.approved = true;
    await messagesRef.push(messageData);
    await pendingMessagesRef.child(messageId).remove();

    console.log(`✅ Message approved: ${messageId}`);
    return {success: true, message: "Message approved and published."};
  } catch (error) {
    console.error("❌ Error approving message:", error);
    throw new functions.https.HttpsError("internal",
        "Error approving message.");
  }
});

/**
 * ✅ Deny Message (Only logged-in users)
 */
exports.denyMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated",
        "You must be signed in to deny messages.");
  }

  const {messageId} = data;
  if (!messageId) {
    throw new
    functions.https.HttpsError("invalid-argument", "Message ID is required.");
  }

  try {
    await pendingMessagesRef.child(messageId).remove();
    console.log(`🗑️ Message denied and deleted: ${messageId}`);
    return {success: true, message: "Message denied and deleted."};
  } catch (error) {
    console.error("❌ Error denying message:", error);
    throw new functions.https.HttpsError("internal", "Error denying message.");
  }
});

/**
 * ✅ Scheduled function: Delete all messages every 3 days
 */
exports.deleteMessages = functions.pubsub
    .schedule("0 0 */3 * *")
    .timeZone("UTC")
    .onRun(async () => {
      try {
        await messagesRef.remove();
        await pendingMessagesRef.remove();
        console.log("✅ All messages and pending messages deleted.");
      } catch (error) {
        console.error("❌ Error deleting messages:", error);
      }
      return null;
    });

/**
 * ✅ Scheduled function: Delete all users every 3 days
 */
exports.deleteUsers = functions.pubsub
    .schedule("0 0 */3 * *")
    .timeZone("UTC")
    .onRun(async () => {
      try {
        const listUsersResult = await admin.auth().listUsers();
        const deletePromises = listUsersResult.users.map((user) => {
          console.log("🗑️ Deleting user:", user.uid);
          return admin.auth().deleteUser(user.uid);
        });

        await Promise.all(deletePromises);
        console.log("✅ All users deleted.");
      } catch (error) {
        console.error("❌ Error deleting users:", error);
      }
      return null;
    });

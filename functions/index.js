const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  databaseURL: "https://live-message-board-default-rtdb.firebaseio.com/",
});

// ✅ Database References
const db = admin.database();
const messagesRef = db.ref("messages");
const pendingMessagesRef = db.ref("pendingMessages");

/**
 * ✅ Submit a Message (Anyone can submit, even without login)
 */
exports.submitMessage = functions.https.onCall(async (data, context) => {
  console.info("📩 [submitMessage] Received submission request:", data);

  const {text, name} = data;
  if (!text || text.trim().length === 0) {
    console.warn("⚠️ [submitMessage] Invalid message text:", text);
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
    console.info("✅ [submitMessage] Message submitted:", messageData);
    return {success: true, message:
      "Message submitted and awaiting approval."};
  } catch (error) {
    console.error("❌ [submitMessage] Error submitting message:", error);
    throw new functions.https.HttpsError("internal",
        "Error submitting message.");
  }
});

/**
 * ✅ Approve Message (Only logged-in users)
 */
exports.approveMessage = functions.https.onCall(async (data, context) => {
  console.info("🔍 [approveMessage] Received approval request:", data);

  if (!context.auth) {
    console.warn("⚠️ [approveMessage] Unauthorized attempt approving message.");
    throw new functions.https.HttpsError("unauthenticated",
        "You must be signed in to approve messages.");
  }

  const {messageId} = data;
  if (!messageId) {
    console.warn("⚠️ [approveMessage] No message ID provided.");
    throw new functions.https.HttpsError("invalid-argument",
        "Message ID is required.");
  }

  try {
    console.info(`🔎 [approveMessage] Fetching message: ${messageId}`);
    const messageSnapshot =
    await pendingMessagesRef.child(messageId).once("value");
    const messageData = messageSnapshot.val();

    if (!messageData) {
      // eslint-disable-next-line max-len
      console.warn(`⚠️ [approveMessage] Message ${messageId} not found in pending.`);
      throw new functions.https.HttpsError("not-found", "Message not found.");
    }

    console.info(`✅ [approveMessage] Moving message ${messageId} to messages.`);
    // Option 1: Retain the same message ID in the approved messages
    // await messagesRef.child(messageId).set(messageData);

    // Option 2: Generate a new key using push (default behavior)
    await messagesRef.push(messageData);

    // Remove the message from pendingMessages
    await pendingMessagesRef.child(messageId).remove();

    console.info("✅ [approveMessage] Message approved and published:",
        messageData);
    return {success: true, message: "Message approved and published."};
  } catch (error) {
    console.error("❌ [approveMessage] Error approving message:", error);
    throw new functions.https.HttpsError("internal",
        "Error approving message.");
  }
});

/**
 * ✅ Deny Message (Only logged-in users)
 */
exports.denyMessage = functions.https.onCall(async (data, context) => {
  console.info("❌ [denyMessage] Received denial request:", data);

  if (!context.auth) {
    console.warn("⚠️ [denyMessage] Unauthorized attempt to deny message.");
    throw new functions.https.HttpsError("unauthenticated",
        "You must be signed in to deny messages.");
  }

  const {messageId} = data;
  if (!messageId) {
    console.warn("⚠️ [denyMessage] No message ID provided.");
    throw new functions.https.HttpsError("invalid-argument",
        "Message ID is required.");
  }

  try {
    // eslint-disable-next-line max-len
    console.info(`🗑️ [denyMessage] Deleting message ${messageId} from pendingMessages.`);
    await pendingMessagesRef.child(messageId).remove();
    console.info(`✅ [denyMessage] Message denied and deleted: ${messageId}`);
    return {success: true, message: "Message denied and deleted."};
  } catch (error) {
    console.error("❌ [denyMessage] Error denying message:", error);
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
      console.info("🗑️ [deleteMessages] Scheduled cleanup started.");

      try {
        await messagesRef.remove();
        await pendingMessagesRef.remove();
        console.info("✅ [deleteMessages] All messages deleted.");
      } catch (error) {
        console.error("❌ [deleteMessages] Error deleting messages:", error);
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
      console.info("🗑️ [deleteUsers] Scheduled user deletion started.");

      try {
        const listUsersResult = await admin.auth().listUsers();
        const deletePromises = listUsersResult.users.map((user) => {
          console.info(`🗑️ [deleteUsers] Deleting user: ${user.uid}`);
          return admin.auth().deleteUser(user.uid);
        });

        await Promise.all(deletePromises);
        console.info("✅ [deleteUsers] All users deleted.");
      } catch (error) {
        console.error("❌ [deleteUsers] Error deleting users:", error);
      }
      return null;
    });

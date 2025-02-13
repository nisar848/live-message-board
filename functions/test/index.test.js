/* eslint-env mocha */
const test = require("firebase-functions-test")();
const admin = require("firebase-admin");
const myFunctions = require("../index.js");

// Wrap your callable functions
const wrappedSubmitMessage = test.wrap(myFunctions.submitMessage);
const wrappedApproveMessage = test.wrap(myFunctions.approveMessage);

// Simulate a callable function context
const fakeContext = {auth: {uid: "testUser"}};

describe("submitMessage", () => {
  it("should submit a message", async () => {
    const data = {text: "Test message", name: "Tester"};
    const result = await wrappedSubmitMessage(data, fakeContext);
    console.log(result);
    // Add assertions as needed
  });
});

describe("approveMessage", () => {
  const testMessageId = "someTestId";
  const pendingMessageData = {
    name: "Test Approve Message",
    text: "This is a pending message for approval",
    timestamp: Date.now(),
  };

  // Create the pending message before the test runs
  before(async () => {
    // eslint-disable-next-line max-len
    await admin.database().ref(`pendingMessages/${testMessageId}`).set(pendingMessageData);
  });

  // Clean up after the test if necessary
  after(async () => {
    // Remove the pending message (if it still exists)
    await admin.database().ref(`pendingMessages/${testMessageId}`).remove();
    // Optionally, remove the approved message from "messages"
    // You might query by timestamp to find it and then remove it.
    const messagesSnapshot = await admin.database().ref("messages")
        .orderByChild("timestamp")
        .equalTo(pendingMessageData.timestamp)
        .once("value");
    if (messagesSnapshot.exists()) {
      const messages = messagesSnapshot.val();
      const removalPromises = Object.keys(messages).map((key) =>
        admin.database().ref(`messages/${key}`).remove(),
      );
      await Promise.all(removalPromises);
    }
  });

  it("should approve a message and move it to messages", async () => {
    const data = {messageId: testMessageId};
    const result = await wrappedApproveMessage(data, fakeContext);
    console.log(result);

    // Verify that the pending message has been removed
    // eslint-disable-next-line max-len
    const pendingSnapshot = await admin.database().ref(`pendingMessages/${testMessageId}`).once("value");
    if (pendingSnapshot.exists()) {
      throw new Error("Message still exists in pendingMessages node");
    }

    // eslint-disable-next-line max-len
    // Since the approved message is added using push(), its key is auto-generated.
    // We'll query the messages node using the unique timestamp value.
    const messagesSnapshot = await admin.database().ref("messages")
        .orderByChild("timestamp")
        .equalTo(pendingMessageData.timestamp)
        .once("value");

    if (!messagesSnapshot.exists()) {
      throw new Error("Approved message not found in messages node");
    }

    // Optionally, you can perform further assertions on the retrieved message.
    const messages = messagesSnapshot.val();
    const keys = Object.keys(messages);
    if (keys.length !== 1) {
      throw new Error("Unexpected number of messages found in messages node");
    }
  });
});

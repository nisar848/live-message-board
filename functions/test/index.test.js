/* eslint-disable max-len */
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
    await admin.database().ref(`pendingMessages/${testMessageId}`).set(pendingMessageData);
  });

  // Clean up after the test if necessary
  after(async () => {
    // Remove the pending message (if it still exists)
    await admin.database().ref(`pendingMessages/${testMessageId}`).remove();

    // Optionally, remove the approved message from "messages"
    // Comment out the following line to keep the approved message in messages.
    // await admin.database().ref(`messages/${testMessageId}`).remove();
  });

  it("should approve a message and move it to messages", async () => {
    const data = {messageId: testMessageId};
    const result = await wrappedApproveMessage(data, fakeContext);
    console.log(result);

    // Verify that the pending message has been removed
    const pendingSnapshot = await admin.database().ref(`pendingMessages/${testMessageId}`).once("value");
    if (pendingSnapshot.exists()) {
      throw new Error("Message still exists in pendingMessages node");
    }

    // Since the approved message is now written using the same messageId,
    // we check directly at that location in the "messages" node.
    const approvedSnapshot = await admin.database().ref(`messages/${testMessageId}`).once("value");

    if (!approvedSnapshot.exists()) {
      throw new Error("Approved message not found in messages node");
    }

    // Optionally, perform further assertions on the approved message's content.
    const approvedMessage = approvedSnapshot.val();
    if (
      approvedMessage.name !== pendingMessageData.name ||
      approvedMessage.text !== pendingMessageData.text ||
      approvedMessage.timestamp !== pendingMessageData.timestamp
    ) {
      throw new Error("Approved message data does not match expected data");
    }
  });
});

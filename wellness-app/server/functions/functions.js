// functions/functions.js
const admin = require("firebase-admin");

// Firestore initialization (if not already in index.js)
const db = admin.firestore();

// Function to handle user creation
exports.handleUserSignup = async (user) => {
  const {uid, email, displayName} = user;

  // Validate incoming user data
  if (!uid || !email) {
    throw new Error("User ID and email are required.");
  }

  const userData = {
    uid: uid,
    email: email,
    displayName: displayName || "No display name",
    status: "active", // Default status
    role: "normal", // Default role
    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add timestamp
  };

  try {
    await db.collection("users").doc(uid).set(userData);
    console.log("User added to Firestore:", uid);
  } catch (error) {
    console.error("Error adding user to Firestore:", error);
  }
};

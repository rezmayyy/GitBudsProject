// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {handleUserSignup} = require("./functions"); // Import the signup handler

// Initialize Firebase Admin
admin.initializeApp();

// Firestore Trigger for User Signup
exports.onUserSignup = functions.auth.user().onCreate((user) => {
  return handleUserSignup(user);
});


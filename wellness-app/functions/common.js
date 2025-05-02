// common.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config();

// For deploying – initialize the Firebase Admin SDK.
// Comment this section for emulated testing
admin.initializeApp({ storageBucket: "tribewell-d4492.appspot.com" });

//uncomment this section for emulated testing
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// const serviceAccountPath = process.env.TRIBEWELL_KEY;

// if (!serviceAccountPath) {
//     throw new Error("Missing TRIBEWELL_KEY environment variable.");
// }
// admin.initializeApp({
//     credential: admin.credential.cert(require(serviceAccountPath)),
//     storageBucket: "tribewell-d4492.appspot.com",
// });
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
const db = admin.firestore();
const { Timestamp, FieldValue } = require("firebase-admin/firestore");

module.exports = { functions, admin, db, Timestamp, FieldValue };

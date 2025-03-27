// common.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("dotenv").config();

// For deploying – initialize the Firebase Admin SDK.
admin.initializeApp();
const db = admin.firestore();
const { Timestamp, FieldValue } = require("firebase-admin/firestore");

module.exports = { functions, admin, db, Timestamp, FieldValue };

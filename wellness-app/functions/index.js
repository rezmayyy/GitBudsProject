/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const functionsModule = require("./functions.js");
module.exports = functionsModule;

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
const functions = require("firebase-functions");
const express = require("express");
const stripe = require("stripe")("sk_test_51Qw8WDPFPGEe3qFbUdy2AiJAHKSaatTIMjXbHcm9EafELfrx2cyyuSjc9oZW7xRVpkHy38xMeymsKp7Tfikrsnmj00v0xI9X7z");

const app = express();

// Set up your POST API route
app.post("/api/create-account-link", async (req, res) => {
  try {
    const {accountId} = req.body; // Get accountId from the request body

    // Create Stripe account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: "YOUR_REFRESH_URL",
      return_url: "YOUR_RETURN_URL",
      type: "account_onboarding",
    });

    // Respond with the account link URL
    res.json({url: accountLink.url});
  } catch (error) {
    console.error("Error creating account link:", error);
    res.status(500).json({error: error.message});
  }
});

// Export your Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const stripe = new Stripe("sk_test_51Qw8WDPFPGEe3qFbUdy2AiJAHKSaatTIMjXbHcm9EafELfrx2cyyuSjc9oZW7xRVpkHy38xMeymsKp7Tfikrsnmj00v0xI9X7z");
require("dotenv").config();

//const serviceAccount = require(process.env.TRIBEWELL_KEY)
//admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

admin.initializeApp();
const db = admin.firestore();

exports.createStripeAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    console.log("===================entering create stripe account function==================================");
    const userId = context.auth.uid;
    const email = data.email;
    console.log(userId);
    console.log(email);
    const account = await stripe.accounts.create({
      type: "express",
      email: email,
      capabilities: {
        transfers: {requested: true},
      },
    });
  
    // Store the Stripe account ID in Firestore
    await admin.firestore().collection("users").doc(userId).set({
      stripeAccountId: account.id,
    }, {merge: true});
  
    return {accountId: account.id};
  });
  
  exports.createStripeAccountLink = functions.https.onCall(async (data, context) => {
    console.log("attempting to fetch account creation link");
    const userId = context.auth.uid;
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const displayName = userData.displayName || "default";
    console.log(displayName);
    try {
      const {accountId} = data;
      if (!accountId) {
        throw new Error("Missing Stripe Account ID");
      }
  
      // Create the Stripe account link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `http://localhost:3000/profile/${displayName}`,
        return_url: `http://localhost:3000/stripe-success?accountId=${accountId}`,
        type: "account_onboarding",
      });
      return {url: accountLink.url, expires_at: accountLink.expires_at};
    } catch (error) {
      console.error("Error creating account link:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });
  
  exports.createDonationSession = functions.https.onCall(async (data, context) => {
    console.log("CREATE DONATION SESSION");
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
  
    const donorId = context.auth.uid;
    const recipientId = data.recipientId;
    const amount = data.amount * 100; // Convert to cents
  
    // Fetch recipient's Stripe account ID
    const recipientDoc = await admin.firestore().collection("users").doc(recipientId).get();
    if (!recipientDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Recipient not found.");
    }
  
    const recipientStripeId = recipientDoc.data().stripeAccountId;
    if (!recipientStripeId) {
      throw new functions.https.HttpsError("failed-precondition", "Recipient is not connected to Stripe.");
    }
  
    // Create a Stripe Checkout session for the donor
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Donation to ${recipientId}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 0.05), // 5% fee (optional)
        transfer_data: {
          destination: recipientStripeId,
        },
      },
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    });
  
    return {sessionId: session.id};
  });
  
  exports.checkStripeAccountStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }
  
    const {accountId} = data;
    if (!accountId) {
      throw new functions.https.HttpsError("invalid-argument", "Missing Stripe Account ID");
    }
  
    try {
      const account = await stripe.accounts.retrieve(accountId);
  
      if (account.details_submitted) {
        return {status: "completed", userId: context.auth.uid};
      } else {
        return {status: "incomplete"};
      }
    } catch (error) {
      console.error("Error fetching Stripe account:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });
  
  exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, functions.config().stripe.webhook_secret);
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(400).send(`Webhook error: ${err.message}`);
    }
  
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const amount = session.amount_total / 100;
      const recipientStripeId = session.transfer_data.destination;
  
      // Find recipient by Stripe account ID
      const usersRef = admin.firestore().collection("users");
      const snapshot = await usersRef.where("stripeAccountId", "==", recipientStripeId).get();
      if (!snapshot.empty) {
        const recipientDoc = snapshot.docs[0];
        await recipientDoc.ref.collection("donations").add({
          amount: amount,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  
    res.status(200).send("Webhook received");
  });
  
  
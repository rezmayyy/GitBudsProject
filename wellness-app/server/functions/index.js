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

//function for handling stripe account creation 
exports.createStripeAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const userId = context.auth.uid;
  const email = data.email;

  const account = await stripe.accounts.create({
      type: "express",
      email: email,
      capabilities: {
          transfers: { requested: true },
      },
  });

  // Store the Stripe account ID in Firestore
  await admin.firestore().collection("users").doc(userId).set({
      stripeAccountId: account.id,
  }, { merge: true });

  return { accountId: account.id };
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

  return { sessionId: session.id };
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


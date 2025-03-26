// =============================
// Firebase Cloud Functions — Grouped & Commented
// =============================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const stripe = new Stripe("sk_test_51Qw8WDPFPGEe3qFbUdy2AiJAHKSaatTIMjXbHcm9EafELfrx2cyyuSjc9oZW7xRVpkHy38xMeymsKp7Tfikrsnmj00v0xI9X7z");
require("dotenv").config();

const serviceAccount = require(process.env.TRIBEWELL_KEY);
admin.initializeApp({credential: admin.credential.cert(serviceAccount)});
const db = admin.firestore();
const {Timestamp, FieldValue} = require("firebase-admin/firestore");


// Helper — enforce admin/moderator permissions
async function assertAdminOrModerator(uid) {
  const snap = await db.collection("users").doc(uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (!["admin", "moderator"].includes(role)) {
    throw new functions.https.HttpsError("permission-denied", "Only admins or moderators can perform this action.");
  }
}

// =============================
// ADMIN & MODERATION FUNCTIONS
// =============================

// Ban a user
exports.banUser = functions.https.onCall(async (data, context) => {
  const {userId, duration, reason} = data.data || data;
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  await assertAdminOrModerator(authInfo.uid);

  try {
    const bannedUntil = Timestamp.fromDate(new Date(Date.now() + duration * 86400000));
    await admin.auth().updateUser(userId, {disabled: true});
    await db.collection("users").doc(userId).set({unbanDate: bannedUntil}, {merge: true});
    await db.collection("users").doc(userId).collection("punishments").add({reason, duration, bannedBy: authInfo.uid, timestamp: Timestamp.now(), unbanDate: bannedUntil});
    return {message: `User banned for ${duration} days.`};
  } catch (error) {
    console.error("Error banning user:", error);
    throw new functions.https.HttpsError("internal", "Failed to ban user.");
  }
});

// Unban a single user
exports.unbanUser = functions.https.onCall(async (data, context) => {
  const {userId} = data.data || data;
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  await assertAdminOrModerator(authInfo.uid);

  try {
    await admin.auth().updateUser(userId, {disabled: false});
    await db.collection("users").doc(userId).update({unbanDate: FieldValue.delete()});
    const punishmentsRef = db.collection("users").doc(userId).collection("punishments");
    const snap = await punishmentsRef.orderBy("timestamp", "desc").limit(1).get();
    if (!snap.empty) await punishmentsRef.doc(snap.docs[0].id).delete();
    return {message: "User unbanned."};
  } catch (error) {
    console.error("Error unbanning user:", error);
    throw new functions.https.HttpsError("internal", "Failed to unban user.");
  }
});

// Scheduled auto-unban
exports.unbanUsers = functions.pubsub.schedule("every 24 hours").onRun(async () => {
  const now = Timestamp.now();
  const toUnban = await db.collection("users").where("unbanDate", "<=", now).get();
  await Promise.all(toUnban.docs.map(async (doc) => {
    const uid = doc.id;
    await admin.auth().updateUser(uid, {disabled: false});
    await db.collection("users").doc(uid).update({unbanDate: FieldValue.delete()});
    await db.collection("users").doc(uid).collection("punishments").orderBy("timestamp", "desc").limit(1).get().then((s) => s.empty ? null : s.docs[0].ref.delete());
  }));
});

// =============================
// CONTENT FUNCTIONS
// =============================

exports.createContentPost = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const {postData, filePath, thumbnailPath} = data.data || data;
  const userId = authInfo.uid;

  // Validate storage paths
  if (postData.type !== "article") {
    try {
      const decode = (url) => decodeURIComponent(new URL(url).pathname.split("/o/")[1]);
      if (!decode(filePath).startsWith(`${postData.type}-uploads/${userId}/`) || !decode(thumbnailPath).startsWith(`thumbnails/${userId}/`)) {
        throw new Error();
      }
    } catch {
      throw new functions.https.HttpsError("permission-denied", "Invalid file URL");
    }
  }

  const settings = await db.collection("adminSettings").doc("uploadRules").get().catch(() => null);
  const autoApprove = settings?.data()?.AutoApprove === true;

  const newPost = {title: postData.title, description: postData.description || "", body: postData.body || "", author: authInfo.token.name || userId, type: postData.type, fileURL: filePath || null, thumbnailURL: thumbnailPath || null, timestamp: Timestamp.now(), status: autoApprove ? "approved" : "pending", keywords: Array.isArray(postData.keywords) ? postData.keywords : []};
  const docRef = await db.collection("content-posts").add(newPost);
  return {message: "Post created", postId: docRef.id};
});

// =============================
// USER ACCOUNT FUNCTIONS
// =============================

exports.changeDisplayName = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const {newDisplayName} = data.data || data;
  if (!newDisplayName) throw new functions.https.HttpsError("invalid-argument", "New display name required");

  const existing = await db.collection("usernames").doc(newDisplayName).get();
  if (existing.exists) throw new functions.https.HttpsError("already-exists", "Name taken");

  const userRef = db.collection("users").doc(authInfo.uid);
  const old = await userRef.get(); if (!old.exists) throw new functions.https.HttpsError("not-found", "User missing");
  const oldName = old.data().displayName;

  await db.runTransaction((tx) => {
    tx.delete(db.collection("usernames").doc(oldName));
    tx.set(db.collection("usernames").doc(newDisplayName), {uid: authInfo.uid});
    tx.update(userRef, {displayName: newDisplayName});
  });
  return {message: "Display name updated"};
});

exports.changePassword = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const {newPassword} = data.data || data;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!regex.test(newPassword)) throw new functions.https.HttpsError("invalid-argument", "Password too weak");
  await admin.auth().updateUser(authInfo.uid, {password: newPassword});
  return {message: "Password changed"};
});


exports.deleteAccount = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const uid = authInfo.uid;

  // --- STORAGE CLEANUP ---
  const storagePaths = [
    `video-uploads/${uid}`,
    `audio-uploads/${uid}`,
    `article-images/${uid}`,
    `profile-pics/${uid}`,
    `thumbnails/${uid}`,
  ];
  const bucket = admin.storage().bucket();
  for (const prefix of storagePaths) await bucket.deleteFiles({prefix});

  // --- MASK CONTENT AND DISCUSSION POSTS ---
  for (const postDoc of (await db.collection("content-posts").get()).docs) await maskContentPost(postDoc, uid);
  for (const postDoc of (await db.collection("posts").get()).docs) await maskDiscussionPost(postDoc, uid);

  // --- DELETE OTHER COLLECTION RECORDS ---
  await deleteCollectionDocs("diary_entries", uid);
  await deleteCollectionDocs("healers", uid);

  // --- REMOVE USER RECORDS & AUTH ---
  const userSnap = await db.collection("users").doc(uid).get();
  const displayName = userSnap.exists ? userSnap.data().displayName : null;
  if (displayName) await db.collection("usernames").doc(displayName).delete();
  await db.collection("users").doc(uid).delete();
  await admin.auth().deleteUser(uid);

  return {message: "Account fully deleted and content masked"};
});

// =============================
// HELPERS
// =============================

async function deleteCollectionDocs(collectionName, uid) {
  const snap = await db.collection(collectionName).where("userId", "==", uid).get();
  for (const doc of snap.docs) await doc.ref.delete();
}

// Helper: mask a content-post (top-level, comments, replies)
async function maskContentPost(docSnap, uid) {
  const data = docSnap.data();
  if (data.userId === uid) {
    await docSnap.ref.update({userId: null, userName: "[Deleted]", message: "[deleted]"});
  }
  const comments = await docSnap.ref.collection("comments").get();
  for (const comment of comments.docs) {
    const cData = comment.data();
    if (cData.userId === uid) await comment.ref.update({userId: null, userName: "[Deleted]", message: "[deleted]"});
    const replies = await comment.ref.collection("replies").get();
    for (const reply of replies.docs) {
      if (reply.data().userId === uid) await reply.ref.update({userId: null, userName: "[Deleted]", message: "[deleted]"});
    }
  }
}

// Helper: mask a discussion board post
async function maskDiscussionPost(docSnap, uid) {
  const data = docSnap.data();
  const update = {};
  if (data.userId === uid) Object.assign(update, {userId: null, userName: "[Deleted]", message: "[deleted]"});
  if (Array.isArray(data.replies)) {
    const newReplies = data.replies.map((reply) => reply.userId === uid ?
      {...reply, userId: null, userName: "[Deleted]", message: "[deleted]"} :
      reply,
    );
    if (JSON.stringify(newReplies) !== JSON.stringify(data.replies)) update.replies = newReplies;
  }
  if (Object.keys(update).length) await docSnap.ref.update(update);
}


// =============================
// MISCELLANEOUS FUNCTIONS
// =============================

exports.applyForHealer = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth; if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const {details} = data.data || data; if (!details) throw new functions.https.HttpsError("invalid-argument", "Details required");
  const ref = await db.collection("healerApplications").add({applicantId: authInfo.uid, details, status: "pending", createdAt: Timestamp.now()});
  return {id: ref.id};
});

exports.reportUser = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth; if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");
  const {ruleViolation, reportDescription, contentUrl, offendingUserId} = data.data || data;
  const ticket = {category: "report", title: ruleViolation, body: `Offending User: ${offendingUserId}\nOffending URL: ${contentUrl}\nDescription: ${reportDescription}`, createdAt: Timestamp.now(), status: "pending", userId: authInfo.uid, displayName: authInfo.token.name || authInfo.uid};
  const ref = await db.collection("tickets").add(ticket);
  return {ticketId: ref.id};
});

// =============================
// EMAIL CHANGE FUNCTIONS
// =============================

// Step 1️⃣: Request email change — sends a confirmation link to the user’s current email
exports.requestEmailChange = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const {newEmail} = data.data || data;
  if (!newEmail) throw new functions.https.HttpsError("invalid-argument", "New email required");

  const tokenDoc = db.collection("emailChangeRequests").doc();
  const token = tokenDoc.id;
  const expires = Timestamp.fromDate(new Date(Date.now() + 3600 * 1000)); // 1 hour

  await tokenDoc.set({uid: authInfo.uid, newEmail, expires});
  const confirmUrl = `${process.env.REACT_APP_APP_URL}/confirm-email-change?token=${token}`;

  await admin.auth().generateEmailVerificationLink(authInfo.token.email, {url: confirmUrl});
  return {message: "A confirmation link has been sent to your current email."};
});

// Step 2️⃣: Confirm email change — called when user clicks the link
exports.confirmEmailChange = functions.https.onCall(async (data, context) => {
  const {token} = data.data || data;
  if (!token) throw new functions.https.HttpsError("invalid-argument", "Token required");

  const tokenDoc = await db.collection("emailChangeRequests").doc(token).get();
  if (!tokenDoc.exists) throw new functions.https.HttpsError("not-found", "Invalid or expired token");

  const {uid, newEmail, expires} = tokenDoc.data();
  if (expires.toDate() < new Date()) {
    await tokenDoc.ref.delete();
    throw new functions.https.HttpsError("deadline-exceeded", "Token expired");
  }

  await admin.auth().updateUser(uid, {email: newEmail});
  await tokenDoc.ref.delete();
  return {message: "Email updated successfully."};
});

// function for handling stripe account creation
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


// =============================
// Firebase Cloud Functions — Grouped & Commented
// =============================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require(process.env.TRIBEWELL_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

// Helper — enforce admin/moderator permissions
async function assertAdminOrModerator(uid) {
  const snap = await db.collection('users').doc(uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (!['admin', 'moderator'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins or moderators can perform this action.');
  }
}

// =============================
// ADMIN & MODERATION FUNCTIONS
// =============================

// Ban a user
exports.banUser = functions.https.onCall(async (data, context) => {
  const { userId, duration, reason } = data.data || data;
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  await assertAdminOrModerator(authInfo.uid);

  try {
    const bannedUntil = Timestamp.fromDate(new Date(Date.now() + duration * 86400000));
    await admin.auth().updateUser(userId, { disabled: true });
    await db.collection('users').doc(userId).set({ unbanDate: bannedUntil }, { merge: true });
    await db.collection('users').doc(userId).collection('punishments').add({ reason, duration, bannedBy: authInfo.uid, timestamp: Timestamp.now(), unbanDate: bannedUntil });
    return { message: `User banned for ${duration} days.` };
  } catch (error) {
    console.error('Error banning user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to ban user.');
  }
});

// Unban a single user
exports.unbanUser = functions.https.onCall(async (data, context) => {
  const { userId } = data.data || data;
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  await assertAdminOrModerator(authInfo.uid);

  try {
    await admin.auth().updateUser(userId, { disabled: false });
    await db.collection('users').doc(userId).update({ unbanDate: FieldValue.delete() });
    const punishmentsRef = db.collection('users').doc(userId).collection('punishments');
    const snap = await punishmentsRef.orderBy('timestamp', 'desc').limit(1).get();
    if (!snap.empty) await punishmentsRef.doc(snap.docs[0].id).delete();
    return { message: 'User unbanned.' };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unban user.');
  }
});

// Scheduled auto-unban
exports.unbanUsers = functions.pubsub.schedule('every 24 hours').onRun(async () => {
  const now = Timestamp.now();
  const toUnban = await db.collection('users').where('unbanDate', '<=', now).get();
  await Promise.all(toUnban.docs.map(async doc => {
    const uid = doc.id;
    await admin.auth().updateUser(uid, { disabled: false });
    await db.collection('users').doc(uid).update({ unbanDate: FieldValue.delete() });
    await db.collection('users').doc(uid).collection('punishments').orderBy('timestamp', 'desc').limit(1).get().then(s => s.empty ? null : s.docs[0].ref.delete());
  }));
});

// =============================
// CONTENT FUNCTIONS
// =============================

exports.createContentPost = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { postData, filePath, thumbnailPath } = data.data || data;
  const userId = authInfo.uid;

  // Validate storage paths
  if (postData.type !== 'article') {
    try {
      const decode = url => decodeURIComponent(new URL(url).pathname.split('/o/')[1]);
      if (
        !decode(filePath).startsWith(`${postData.type}-uploads/${userId}/`) ||
        !decode(thumbnailPath).startsWith(`thumbnails/${userId}/`)
      ) {
        throw new Error();
      }
    } catch {
      throw new functions.https.HttpsError('permission-denied', 'Invalid file URL');
    }
  }

  const settingsSnap = await db.collection('adminSettings').doc('uploadRules').get().catch(() => null);
  const autoApprove = settingsSnap?.data()?.AutoApprove === true;

  const newPost = {
    title: postData.title,
    description: postData.description || '',
    body: postData.body || '',
    type: postData.type,
    fileURL: filePath || null,
    thumbnailURL: thumbnailPath || null,
    timestamp: Timestamp.now(),
    status: autoApprove ? 'approved' : 'pending',
    keywords: Array.isArray(postData.keywords) ? postData.keywords : [],
    userId: userId // 
  };

  const docRef = await db.collection('content-posts').add(newPost);

  return { message: 'Post created', postId: docRef.id };
});

// =============================
// USER ACCOUNT FUNCTIONS
// =============================

exports.handleUserSignup = functions.https.onCall(async (data, context) => {
  // Expect payload: { email, password, firstName, lastName, displayName }
  const { email, password, displayName } = data.data || data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email, password, first name, last name, and display name are required.'
    );
  }

  // Regex: at least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.'
    );
  }

  // Check if the chosen displayName is already taken.
  const usernameDoc = await db.collection('usernames').doc(displayName).get();
  if (usernameDoc.exists) {
    throw new functions.https.HttpsError('already-exists', 'Display name is already taken.');
  }

  try {
    // Create the user in Firebase Auth (account created enabled)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName
    });

    // Reserve the displayName in the usernames collection.
    await db.collection('usernames').doc(displayName).set({ uid: userRecord.uid });

    // Create the public user document in the "users" collection (only public info)
    await db.collection('users').doc(userRecord.uid).set({
      displayName: displayName
    });

    // Create a subcollection "privateInfo" under the user document for sensitive data.
    await db.collection('users').doc(userRecord.uid)
      .collection('privateInfo').doc('info').set({
        email: email
      });

    // Create a custom token so the client can sign in.
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return {
      message: 'Signup initiated. Please check your email for a confirmation link.',
      token: customToken
    };
  } catch (error) {
    console.error('Error in handleUserSignup:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.changeDisplayName = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { newDisplayName } = data.data || data;
  if (!newDisplayName) throw new functions.https.HttpsError('invalid-argument', 'New display name required');

  const existing = await db.collection('usernames').doc(newDisplayName).get();
  if (existing.exists) throw new functions.https.HttpsError('already-exists', 'Name taken');

  const userRef = db.collection('users').doc(authInfo.uid);
  const old = await userRef.get(); if (!old.exists) throw new functions.https.HttpsError('not-found', 'User missing');
  const oldName = old.data().displayName;

  await db.runTransaction(tx => {
    tx.delete(db.collection('usernames').doc(oldName));
    tx.set(db.collection('usernames').doc(newDisplayName), { uid: authInfo.uid });
    tx.update(userRef, { displayName: newDisplayName });
  });
  return { message: 'Display name updated' };
});

exports.changePassword = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { newPassword } = data.data || data;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!regex.test(newPassword)) throw new functions.https.HttpsError('invalid-argument', 'Password too weak');
  await admin.auth().updateUser(authInfo.uid, { password: newPassword });
  return { message: 'Password changed' };
});


exports.deleteAccount = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = authInfo.uid;

  // --- STORAGE CLEANUP ---
  const storagePaths = [
    `video-uploads/${uid}`,
    `audio-uploads/${uid}`,
    `article-images/${uid}`,
    `profile-pics/${uid}`,
    `thumbnails/${uid}`
  ];
  const bucket = admin.storage().bucket();
  for (const prefix of storagePaths) await bucket.deleteFiles({ prefix });

  // --- MASK CONTENT AND DISCUSSION POSTS ---
  for (const postDoc of (await db.collection('content-posts').get()).docs) await maskContentPost(postDoc, uid);
  for (const postDoc of (await db.collection('posts').get()).docs) await maskDiscussionPost(postDoc, uid);

  // --- DELETE OTHER COLLECTION RECORDS ---
  await deleteCollectionDocs('diary_entries', uid);
  await deleteCollectionDocs('healers', uid);

  // --- REMOVE USER RECORDS & AUTH ---
  const userSnap = await db.collection('users').doc(uid).get();
  const displayName = userSnap.exists ? userSnap.data().displayName : null;
  if (displayName) await db.collection('usernames').doc(displayName).delete();
  await db.collection('users').doc(uid).delete();
  await admin.auth().deleteUser(uid);

  return { message: 'Account fully deleted and content masked' };
});

// =============================
// HELPERS
// =============================

async function deleteCollectionDocs(collectionName, uid) {
  const snap = await db.collection(collectionName).where('userId', '==', uid).get();
  for (const doc of snap.docs) await doc.ref.delete();
}

// Helper: mask a content-post (top-level, comments, replies)
async function maskContentPost(docSnap, uid) {
  const data = docSnap.data();
  if (data.userId === uid) {
    await docSnap.ref.update({ userId: null, userName: '[Deleted]', message: '[deleted]' });
  }
  const comments = await docSnap.ref.collection('comments').get();
  for (const comment of comments.docs) {
    const cData = comment.data();
    if (cData.userId === uid) await comment.ref.update({ userId: null, userName: '[Deleted]', message: '[deleted]' });
    const replies = await comment.ref.collection('replies').get();
    for (const reply of replies.docs) {
      if (reply.data().userId === uid) await reply.ref.update({ userId: null, userName: '[Deleted]', message: '[deleted]' });
    }
  }
}

// Helper: mask a discussion board post
async function maskDiscussionPost(docSnap, uid) {
  const data = docSnap.data();
  const update = {};
  if (data.userId === uid) Object.assign(update, { userId: null, userName: '[Deleted]', message: '[deleted]' });
  if (Array.isArray(data.replies)) {
    const newReplies = data.replies.map(reply => reply.userId === uid
      ? { ...reply, userId: null, userName: '[Deleted]', message: '[deleted]' }
      : reply
    );
    if (JSON.stringify(newReplies) !== JSON.stringify(data.replies)) update.replies = newReplies;
  }
  if (Object.keys(update).length) await docSnap.ref.update(update);
}


// =============================
// MISCELLANEOUS FUNCTIONS
// =============================

exports.applyForHealer = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth; if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { details } = data.data || data; if (!details) throw new functions.https.HttpsError('invalid-argument', 'Details required');
  const ref = await db.collection('healerApplications').add({ applicantId: authInfo.uid, details, status: 'pending', createdAt: Timestamp.now() });
  return { id: ref.id };
});

exports.reportUser = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth; if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { ruleViolation, reportDescription, contentUrl, offendingUserId } = data.data || data;
  const ticket = { category: 'report', title: ruleViolation, body: `Offending User: ${offendingUserId}\nOffending URL: ${contentUrl}\nDescription: ${reportDescription}`, createdAt: Timestamp.now(), status: 'pending', userId: authInfo.uid, displayName: authInfo.token.name || authInfo.uid };
  const ref = await db.collection('tickets').add(ticket);
  return { ticketId: ref.id };
});

// =============================
// EMAIL CHANGE FUNCTIONS
// =============================

// Step 1️: Request email change — sends a confirmation link to the user’s current email
exports.requestEmailChange = functions.https.onCall(async (data, context) => {
  const authInfo = context.auth || data.auth;
  if (!authInfo) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { newEmail } = data.data || data;
  if (!newEmail) throw new functions.https.HttpsError('invalid-argument', 'New email required');

  const tokenDoc = db.collection('emailChangeRequests').doc();
  const token = tokenDoc.id;
  const expires = Timestamp.fromDate(new Date(Date.now() + 3600 * 1000)); // 1 hour

  await tokenDoc.set({ uid: authInfo.uid, newEmail, expires });
  const confirmUrl = `${process.env.REACT_APP_APP_URL}/confirm-email-change?token=${token}`;

  await admin.auth().generateEmailVerificationLink(authInfo.token.email, { url: confirmUrl });
  return { message: 'A confirmation link has been sent to your current email.' };
});

// Step 2️: Confirm email change — called when user clicks the link
exports.confirmEmailChange = functions.https.onCall(async (data, context) => {
  const { token } = data.data || data;
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Token required');

  const tokenDoc = await db.collection('emailChangeRequests').doc(token).get();
  if (!tokenDoc.exists) throw new functions.https.HttpsError('not-found', 'Invalid or expired token');

  const { uid, newEmail, expires } = tokenDoc.data();
  if (expires.toDate() < new Date()) {
    await tokenDoc.ref.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'Token expired');
  }

  await admin.auth().updateUser(uid, { email: newEmail });
  await tokenDoc.ref.delete();
  return { message: 'Email updated successfully.' };
});
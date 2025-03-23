const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
require('dotenv').config();

const serviceAccount = require(process.env.TRIBEWELL_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const { Timestamp } = require('firebase-admin/firestore');

// Function to ban a user by disabling their account and setting an unban date
exports.banUser = functions.https.onCall(async (data, context) => {
  const { userId, duration, reason } = data.data || data;
  const authInfo = context.auth || data.auth;
  // Only admins and moderators can ban users
  if (!authInfo || !(authInfo.token.role === 'admin' || authInfo.token.role === 'moderator')) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins or moderators can ban users.');
  }

  try {
    const bannedUntil = admin.firestore.Timestamp.fromDate(new Date(Date.now() + duration * 24 * 60 * 60 * 1000));

    // Disable the user in Firebase Auth
    await admin.auth().updateUser(userId, { disabled: true });

    // Set the unban date in Firestore
    await db.collection('users').doc(userId).set(
      { unbanDate: bannedUntil },
      { merge: true }
    );

    // Create a new document in the punishments sub-collection with the ban details
    await db.collection('users').doc(userId).collection('punishments').add({
      reason: reason,
      duration: duration,
      bannedBy: context.auth.token.uid, // Store the UID of the admin/moderator banning the user
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: `User has been banned for ${duration} days. Reason: ${reason}` };
  } catch (error) {
    console.error('Error banning user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to ban user.');
  }
});

exports.createContentPost = functions.https.onCall(async (data, context) => {
  // Require an authenticated user
  const authInfo = context.auth || data.auth;
  if (!authInfo) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { postData, filePath, thumbnailPath } = (data.data || data);
  const userId = authInfo.uid;

  // Basic check: ensure that filePath starts with the expected subfolder (for non-articles)
  if (postData.type !== 'article') {
    // Decode the file URL to extract the storage path
    try {
      const url = new URL(filePath);
      const encodedPath = url.pathname.split('/o/')[1];
      const decodedPath = decodeURIComponent(encodedPath);

      const expectedFolder = `${postData.type}-uploads/${userId}/`;
      if (!decodedPath.startsWith(expectedFolder)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Invalid file path. File must be uploaded to your designated folder.'
        );
      }

      // Similarly, decode and verify thumbnailPath
      const thumbUrl = new URL(thumbnailPath);
      const thumbEncoded = thumbUrl.pathname.split('/o/')[1];
      const decodedThumbPath = decodeURIComponent(thumbEncoded);
      const expectedThumbFolder = `thumbnails/${userId}/`;
      if (!decodedThumbPath.startsWith(expectedThumbFolder)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Invalid thumbnail path. Thumbnail must be uploaded to your designated folder.'
        );
      }
    } catch (err) {
      console.error("Error parsing file paths:", err);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid file URL format.'
      );
    }
  }

  // Query the auto-approval setting
  let autoApprove = false;
  try {
    const settingsDoc = await db.collection("adminSettings").doc("uploadRules").get();
    if (settingsDoc.exists) {
      autoApprove = settingsDoc.data().AutoApprove === true;
    }
  } catch (err) {
    console.error("Error fetching auto-approve settings:", err);
  }

  // Build your new post object
  const newPost = {
    title: postData.title,
    description: postData.description || '',
    body: postData.body || '',
    author: authInfo.token.name || userId,
    type: postData.type,
    fileURL: filePath || null,
    thumbnailURL: thumbnailPath || null,
    timestamp: Timestamp.now(),
    status: autoApprove ? "approved" : "pending",
    keywords: Array.isArray(postData.keywords) ? postData.keywords : []
  };

  try {
    const docRef = await db.collection("content-posts").add(newPost);
    return { message: "Post created successfully", postId: docRef.id };
  } catch (error) {
    console.error("Error creating post:", error);
    throw new functions.https.HttpsError("internal", "Failed to create post.");
  }
});

exports.unbanUser = functions.https.onCall(async (data, context) => {
  const { userId } = data.data || data;
  const authInfo = context.auth || data.auth;

  if (!authInfo || !(authInfo.token.role === 'admin' || authInfo.token.role === 'moderator')) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins or moderators can unban users.');
  }

  try {
    // Reactivate the account by removing the unbanDate and enabling the user in Firebase Auth
    await admin.auth().updateUser(userId, { disabled: false });

    // Remove the unbanDate field from Firestore
    await db.collection('users').doc(userId).update({
      unbanDate: admin.firestore.FieldValue.delete(),
    });

    // Add a new "status: appealed" to the user's latest punishment
    const punishmentsRef = db.collection('users').doc(userId).collection('punishments');
    const punishmentsSnap = await punishmentsRef.orderBy('timestamp', 'desc').limit(1).get();
    if (!punishmentsSnap.empty) {
      const latestPunishment = punishmentsSnap.docs[0];
      await punishmentsRef.doc(latestPunishment.id).update({ status: 'appealed' });
    }

    return { message: 'User has been unbanned and their punishment status updated to appealed.' };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to unban user.');
  }
});

// Function to automatically unban users when the unban date is reached
exports.unbanUsers = onSchedule('every 24 hours', async (event) => {
  try {
    const now = admin.firestore.Timestamp.now();

    const usersToUnban = await db.collection('users')
      .where('unbanDate', '<=', now)
      .get();

    const unbanPromises = usersToUnban.docs.map(async (doc) => {
      const userId = doc.id;

      // Enable user in Firebase Auth
      await admin.auth().updateUser(userId, { disabled: false });

      // Remove the unbanDate field
      await db.collection('users').doc(userId).update({
        unbanDate: admin.firestore.FieldValue.delete()
      });

      // Optionally, you could send a notification to the user here
    });

    await Promise.all(unbanPromises);
    console.log('Unbanned users successfully.');
  } catch (error) {
    console.error('Error unbanning users:', error);
  }
});

exports.handleUserSignup = functions.https.onCall(async (data, context) => {
  const payload = data.data || data;
  console.log("handleUserSignup received data:", payload);
  const { email, password, displayName } = payload;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email, password, and display name are required.'
    );
  }

  // Check if display name is already taken
  const displayNameRef = db.collection("usernames").doc(displayName);
  const displayNameDoc = await displayNameRef.get();
  if (displayNameDoc.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      'Display name is already taken.'
    );
  }

  try {
    // Create the user using the Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Create a custom token for client sign-in
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Reserve the display name and create the user document atomically
    const userRef = db.collection("users").doc(userRecord.uid);
    await db.runTransaction(async (transaction) => {
      transaction.set(displayNameRef, { uid: userRecord.uid });
      transaction.set(userRef, {
        uid: userRecord.uid,
        email,
        displayName,
        status: "active",
        role: "normal",
      });
    });

    return { message: "User signed up successfully", token: customToken, uid: userRecord.uid };
  } catch (error) {
    console.error("Error signing up user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.reportUser = functions.https.onCall(async (data, context) => {
  const { userId, reason } = data.data || data;
  const authInfo = context.auth || data.auth;
  if (!authInfo) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  try {
    await db.collection('users')
      .doc(userId)
      .collection('reports')
      .add({
        reason,
        reportedBy: authInfo.uid,
        timestamp: Timestamp.now(),
      });
    return { message: `User reported: ${reason}` };
  } catch (error) {
    console.error('Error reporting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to report user.');
  }
});

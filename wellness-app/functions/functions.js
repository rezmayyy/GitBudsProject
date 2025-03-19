const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onSchedule } = require('firebase-functions/v2/scheduler');
require('dotenv').config();

if (process.env.NODE_ENV !== 'production') {
  const serviceAccount = require(process.env.TRIBEWELL_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  admin.initializeApp();
}
const db = admin.firestore();

// Function to ban a user by disabling their account and setting an unban date
exports.banUser = functions.https.onCall(async (data, context) => {
  const { userId, duration, reason } = data;

  // Only admins and moderators can ban users
  if (!context.auth || !(context.auth.token.role === 'admin' || context.auth.token.role === 'moderator')) {
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

exports.unbanUser = functions.https.onCall(async (data, context) => {
  const { userId } = data;

  if (!context.auth || !(context.auth.token.role === 'admin' || context.auth.token.role === 'moderator')) {
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

exports.reportUser = async (user) => {
  const { userId, reason } = data;
  try {
      // Create a new document in the reports sub-collection with the details
      await db.collection('users').doc(userId).collection('reports').add({
        reason: reason,
        reportedBy: context.token.uid, // Store the UID of the user who reported
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }); 
      return { message: `User has been reported. Reason: ${reason}` };
    } catch (error) {
      console.error('Error reporting user:', error);
      throw new functions.https.HttpsError('internal', 'Failed to report user.');
    };
};
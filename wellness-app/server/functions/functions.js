const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();
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
exports.unbanUsers = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
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

// Function to handle user creation
exports.handleUserSignup = async (user) => {
  const {uid, email, displayName} = user;

  // Validate incoming user data
  if (!uid || !email) {
    throw new Error("User ID and email are required.");
  }

  const userData = {
    uid: uid,
    email: email,
    displayName: displayName || "No display name",
    status: "active", // Default status
    role: "normal", // Default role
    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add timestamp
  };

  try {
    await db.collection("users").doc(uid).set(userData);
    console.log("User added to Firestore:", uid);
  } catch (error) {
    console.error("Error adding user to Firestore:", error);
  }
};

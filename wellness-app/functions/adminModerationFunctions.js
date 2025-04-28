// adminModerationFunctions.js
const { functions, admin, db, Timestamp, FieldValue } = require("./common");
const { assertAdminOrModerator, assertAdmin } = require("./helpers");

// Ban a user
exports.banUser = functions.https.onCall(async (data, context) => {
    const { userId, duration, reason } = data.data || data;
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    await assertAdminOrModerator(authInfo.uid);

    try {
        const bannedUntil = Timestamp.fromDate(new Date(Date.now() + duration * 86400000));
        await admin.auth().updateUser(userId, { disabled: true });
        await db.collection("users").doc(userId).set({ unbanDate: bannedUntil }, { merge: true });
        await db
            .collection("users")
            .doc(userId)
            .collection("punishments")
            .add({ reason, duration, bannedBy: authInfo.uid, timestamp: Timestamp.now(), unbanDate: bannedUntil });
        return { message: `User banned for ${duration} days.` };
    } catch (error) {
        console.error("Error banning user:", error);
        throw new functions.https.HttpsError("internal", "Failed to ban user.");
    }
});

// Unban a single user
exports.unbanUser = functions.https.onCall(async (data, context) => {
    const { userId } = data.data || data;
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    await assertAdminOrModerator(authInfo.uid);

    try {
        await admin.auth().updateUser(userId, { disabled: false });
        await db.collection("users").doc(userId).update({ unbanDate: FieldValue.delete() });
        const punishmentsRef = db.collection("users").doc(userId).collection("punishments");
        const snap = await punishmentsRef.orderBy("timestamp", "desc").limit(1).get();
        if (!snap.empty) await punishmentsRef.doc(snap.docs[0].id).delete();
        return { message: "User unbanned." };
    } catch (error) {
        console.error("Error unbanning user:", error);
        throw new functions.https.HttpsError("internal", "Failed to unban user.");
    }
});

// Scheduled auto-unban
exports.unbanUsers = functions.pubsub.schedule("every 24 hours").onRun(async () => {
    const now = Timestamp.now();
    const toUnban = await db.collection("users").where("unbanDate", "<=", now).get();
    await Promise.all(
        toUnban.docs.map(async (doc) => {
            const uid = doc.id;
            await admin.auth().updateUser(uid, { disabled: false });
            await db.collection("users").doc(uid).update({ unbanDate: FieldValue.delete() });
            await db
                .collection("users")
                .doc(uid)
                .collection("punishments")
                .orderBy("timestamp", "desc")
                .limit(1)
                .get()
                .then((s) => (s.empty ? null : s.docs[0].ref.delete()));
        })
    );
});


exports.setAdmin = functions.https.onCall(async (data, context) => {
    // Must be authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in');
    }

    // Look up the requester's role in Firestore, not in customClaims
    const requesterSnap = await admin.firestore()
        .doc(`users/${context.auth.uid}`)
        .get();
    const requesterData = requesterSnap.data() || {};

    if (requesterData.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can set admin claims'
        );
    }

    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'No UID provided'
        );
    }

    // Now it's safe to set the custom claim on your target user
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    return { message: `User ${uid} is now an admin.` };
});

// Create a Ticket
exports.createTicket = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userId = authInfo.uid;
    const { title, description } = data.data || data;
    if (!title || !description) {
        throw new functions.https.HttpsError("invalid-argument", "Ticket title and description are required.");
    }
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const userData = userDoc.data();
    let category = "normal";
    if (userData.tier === "VIP") {
        category = "VIP";
    } else if (userData.tier === "Premium") {
        category = "Premium";
    }
    const status = "pending";
    const ticketData = {
        title,
        description,
        createdAt: Timestamp.now(),
        status,
        userId,
        category,
    };
    const ticketRef = await db.collection("tickets").add(ticketData);
    return { message: "Ticket created successfully.", ticketId: ticketRef.id };
});

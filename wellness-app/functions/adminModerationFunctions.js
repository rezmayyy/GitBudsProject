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

// Set user as Admin
exports.setAdmin = functions.https.onCall(async (data, context) => {
    const { userId } = data.data || data;
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    await assertAdmin(authInfo.uid);

    try {
        await admin.auth().updateUser(userId, { admin: true });
        return { message: `User is now Admin.` };
    } catch (error) {
        console.error("Error adding Admin to user:", error);
        throw new functions.https.HttpsError("internal", "Failed to add Admin to user.");
    }
});

// Set user as Mod
exports.setMod = functions.https.onCall(async (data, context) => {
    const { userId } = data.data || data;
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    await assertAdmin(authInfo.uid);

    try {
        await admin.auth().updateUser(userId, { moderator: true });
        return { message: `User is now Mod.` };
    } catch (error) {
        console.error("Error adding Mod to user:", error);
        throw new functions.https.HttpsError("internal", "Failed to add Mod to user.");
    }
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

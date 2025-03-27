// helpers.js
const { db, functions } = require("./common");

async function assertAdminOrModerator(uid) {
    const snap = await db.collection("users").doc(uid).get();
    const role = snap.exists ? snap.data().role : null;
    if (!["admin", "moderator"].includes(role)) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Only admins or moderators can perform this action."
        );
    }
}

async function assertAdmin(uid) {
    const snap = await db.collection("users").doc(uid).get();
    const role = snap.exists ? snap.data().role : null;
    if (!["admin"].includes(role)) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Only admins can perform this action."
        );
    }
}

async function deleteCollectionDocs(collectionName, uid) {
    const snap = await db.collection(collectionName).where("userId", "==", uid).get();
    for (const doc of snap.docs) {
        await doc.ref.delete();
    }
}

async function maskContentPost(docSnap, uid) {
    const data = docSnap.data();
    if (data.userId === uid) {
        await docSnap.ref.update({ userId: null, userName: "[Deleted]", message: "[deleted]" });
    }
    const comments = await docSnap.ref.collection("comments").get();
    for (const comment of comments.docs) {
        const cData = comment.data();
        if (cData.userId === uid) {
            await comment.ref.update({ userId: null, userName: "[Deleted]", message: "[deleted]" });
        }
        const replies = await comment.ref.collection("replies").get();
        for (const reply of replies.docs) {
            if (reply.data().userId === uid) {
                await reply.ref.update({ userId: null, userName: "[Deleted]", message: "[deleted]" });
            }
        }
    }
}

async function maskDiscussionPost(docSnap, uid) {
    const data = docSnap.data();
    const update = {};
    if (data.userId === uid) {
        Object.assign(update, { userId: null, userName: "[Deleted]", message: "[deleted]" });
    }
    if (Array.isArray(data.replies)) {
        const newReplies = data.replies.map((reply) =>
            reply.userId === uid
                ? { ...reply, userId: null, userName: "[Deleted]", message: "[deleted]" }
                : reply
        );
        if (JSON.stringify(newReplies) !== JSON.stringify(data.replies)) {
            update.replies = newReplies;
        }
    }
    if (Object.keys(update).length) {
        await docSnap.ref.update(update);
    }
}

module.exports = {
    assertAdminOrModerator,
    assertAdmin,
    deleteCollectionDocs,
    maskContentPost,
    maskDiscussionPost,
};

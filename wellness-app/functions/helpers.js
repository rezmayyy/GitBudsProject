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

// Deletes documents in a collection where userId === uid
async function deleteByUserField(collectionName, uid) {
    const snap = await db.collection(collectionName).where("userId", "==", uid).get();
    for (const doc of snap.docs) {
        await doc.ref.delete();
    }
}

// Deletes subcollection documents where userId === uid (e.g. replies under a post)
async function deleteRepliesInPosts(uid) {
    const postsSnap = await db.collection("posts").get();
    for (const postDoc of postsSnap.docs) {
        const repliesRef = postDoc.ref.collection("replies");
        const repliesSnap = await repliesRef.where("userId", "==", uid).get();
        for (const reply of repliesSnap.docs) {
            await reply.ref.delete();
        }
    }
}

module.exports = {
    assertAdminOrModerator,
    assertAdmin,
    deleteByUserField,
    deleteRepliesInPosts,
};

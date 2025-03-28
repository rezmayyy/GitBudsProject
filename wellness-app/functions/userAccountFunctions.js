// userAccountFunctions.js
const { functions, admin, db, Timestamp, FieldValue } = require("./common");
const { deleteCollectionDocs, maskContentPost, maskDiscussionPost } = require("./helpers");
const { validateUploadedFile } = require("./fileUtils");

// Handle user signup
exports.handleUserSignup = functions.https.onCall(async (data, context) => {
    const { email, password, displayName } = data.data || data;
    if (!email || !password || !displayName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Email, password, and display name are required."
        );
    }

    const displayNameRegex = /^[A-Za-z0-9_-]{3,20}$/;
    if (!displayNameRegex.test(displayName)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Display name must be 3–20 characters long and contain only letters, numbers, hyphens or underscores."
        );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character."
        );
    }
    const usernameDoc = await db.collection("usernames").doc(displayName).get();
    if (usernameDoc.exists) {
        throw new functions.https.HttpsError("already-exists", "Display name is already taken.");
    }
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });
        await db.collection("usernames").doc(displayName).set({ uid: userRecord.uid });
        await db.collection("users").doc(userRecord.uid).set({
            displayName,
        });
        await db.collection("users").doc(userRecord.uid)
            .collection("privateInfo").doc("info").set({
                email,
            });
        const customToken = await admin.auth().createCustomToken(userRecord.uid);
        return {
            message: "Signup initiated. Please check your email for a confirmation link.",
            token: customToken,
        };
    } catch (error) {
        console.error("Error in handleUserSignup:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

// Change profile picture
exports.changeProfilePic = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth;
    if (!authInfo) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userId = authInfo.uid;
    const { filePath } = data;
    if (!filePath || !filePath.startsWith(`temp/${userId}/`)) {
        throw new functions.https.HttpsError("permission-denied", "Invalid file path.");
    }
    const bucket = admin.storage().bucket();
    await validateUploadedFile(filePath, "image");
    const timestamp = Date.now();
    const fileName = filePath.split("/").pop();
    const finalPath = `profile_pics/${userId}/${timestamp}_${fileName}`;
    await bucket.file(filePath).move(finalPath);
    const movedFile = bucket.file(finalPath);
    await movedFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${finalPath}`;
    await db.collection("users").doc(userId).set({ profilePicUrl: publicUrl }, { merge: true });
    return { message: "Profile picture updated successfully.", profilePicUrl: publicUrl };
});

// Change display name
exports.changeDisplayName = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");

    const { newDisplayName } = data.data || data;

    if (!newDisplayName)
        throw new functions.https.HttpsError("invalid-argument", "New display name required");

    const displayNameRegex = /^[A-Za-z0-9_-]{3,20}$/;
    if (!displayNameRegex.test(newDisplayName)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Display name must be 3–20 characters and can only include letters, numbers, underscores, and hyphens."
        );
    }

    const existing = await db.collection("usernames").doc(newDisplayName).get();
    if (existing.exists)
        throw new functions.https.HttpsError("already-exists", "Name taken");

    const userRef = db.collection("users").doc(authInfo.uid);
    const old = await userRef.get();
    if (!old.exists)
        throw new functions.https.HttpsError("not-found", "User missing");

    const oldName = old.data().displayName;

    await db.runTransaction((tx) => {
        tx.delete(db.collection("usernames").doc(oldName));
        tx.set(db.collection("usernames").doc(newDisplayName), { uid: authInfo.uid });
        tx.update(userRef, { displayName: newDisplayName });
    });

    return { message: "Display name updated" };
});


// Change password
exports.changePassword = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { newPassword } = data.data || data;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!regex.test(newPassword))
        throw new functions.https.HttpsError("invalid-argument", "Password too weak");
    await admin.auth().updateUser(authInfo.uid, { password: newPassword });
    return { message: "Password changed" };
});

// Delete account
exports.deleteAccount = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");

    const uid = authInfo.uid;
    const storagePaths = [
        `video-uploads/${uid}`,
        `audio-uploads/${uid}`,
        `article-images/${uid}`,
        `profile-pics/${uid}`,
        `thumbnails/${uid}`,
    ];

    const bucket = admin.storage().bucket();
    for (const prefix of storagePaths) {
        await bucket.deleteFiles({ prefix });
    }

    // 🔥 Delete Firestore content
    await deleteByUserField("content-posts", uid);
    await deleteByUserField("diary_entries", uid);
    await deleteByUserField("healers", uid);
    await deleteRepliesInPosts(uid);

    // 🔥 Remove username doc
    const userSnap = await db.collection("users").doc(uid).get();
    const displayName = userSnap.exists ? userSnap.data().displayName : null;
    if (displayName) await db.collection("usernames").doc(displayName).delete();

    // 🔥 Remove user record
    await db.collection("users").doc(uid).delete();
    await admin.auth().deleteUser(uid);

    return { message: "Account fully deleted and all user data removed" };
});

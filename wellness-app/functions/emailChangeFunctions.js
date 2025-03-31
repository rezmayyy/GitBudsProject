// emailChangeFunctions.js
const { functions, admin, db, Timestamp } = require("./common");

// Request email change
exports.requestEmailChange = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { newEmail } = data.data || data;
    if (!newEmail)
        throw new functions.https.HttpsError("invalid-argument", "New email required");
    const tokenDoc = db.collection("emailChangeRequests").doc();
    const token = tokenDoc.id;
    const expires = Timestamp.fromDate(new Date(Date.now() + 3600 * 1000));
    await tokenDoc.set({ uid: authInfo.uid, newEmail, expires });
    const confirmUrl = `${process.env.REACT_APP_APP_URL}/confirm-email-change?token=${token}`;
    await admin.auth().generateEmailVerificationLink(authInfo.token.email, { url: confirmUrl });
    return { message: "A confirmation link has been sent to your current email." };
});

// Confirm email change
exports.confirmEmailChange = functions.https.onCall(async (data, context) => {
    const { token } = data.data || data;
    if (!token)
        throw new functions.https.HttpsError("invalid-argument", "Token required");
    const tokenDoc = await db.collection("emailChangeRequests").doc(token).get();
    if (!tokenDoc.exists)
        throw new functions.https.HttpsError("not-found", "Invalid or expired token");
    const { uid, newEmail, expires } = tokenDoc.data();
    if (expires.toDate() < new Date()) {
        await tokenDoc.ref.delete();
        throw new functions.https.HttpsError("deadline-exceeded", "Token expired");
    }
    await admin.auth().updateUser(uid, { email: newEmail });
    await tokenDoc.ref.delete();
    return { message: "Email updated successfully." };
});

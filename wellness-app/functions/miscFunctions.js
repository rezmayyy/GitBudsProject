// miscFunctions.js
const { functions, admin, db, Timestamp } = require("./common");

// Apply for Healer
exports.applyForHealer = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { details } = data.data || data;
    if (!details)
        throw new functions.https.HttpsError("invalid-argument", "Details required");
    const ref = await db.collection("healerApplications").add({
        applicantId: authInfo.uid,
        details,
        status: "pending",
        createdAt: Timestamp.now(),
    });
    return { id: ref.id };
});

// Report User
exports.reportUser = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { ruleViolation, description, contentUrl, userId: offendingUserId } = data.data || data;
    const ticket = {
        category: "report",
        title: ruleViolation,
        description: `Offending User: ${offendingUserId}\nOffending URL: ${contentUrl}\nDescription: ${description}`,
        createdAt: Timestamp.now(),
        status: "pending",
        userId: authInfo.uid,
        displayName: authInfo.token.name || authInfo.uid,
    };
    const ref = await db.collection("tickets").add(ticket);
    return { ticketId: ref.id };
});

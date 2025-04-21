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


// Seed Default Tags
exports.seedDefaultTags = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");


    //admin check
    const user = await admin.auth().getUser(authInfo.uid);
    const displayName = user.displayName;

    // Pull from Firestore
    const userDoc = await db.collection("usernames").doc(displayName).get();

    if (!userDoc.exists || userDoc.data().role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Admin privileges required.");
    }

    const DEFAULT_TAGS = [
        { name: "Business Advice" },
        { name: "Healer Q&A" },
        { name: "Insights" },
        { name: "Marketing Tips" },
        { name: "New Features" },
        { name: "Personal Growth" },
    ];


    const tagsRef = db.collection("tags"); //COLLECTION
    const existing = await tagsRef.limit(1).get();
    if (!existing.empty) {
        return { status: "tags_exist" };
    }


    const batch = db.batch();
    DEFAULT_TAGS.forEach(tag => {
        const docRef = tagsRef.doc();
        batch.set(docRef, tag);
    });


    await batch.commit();
    return { status: "default_tags_seeded" };
});

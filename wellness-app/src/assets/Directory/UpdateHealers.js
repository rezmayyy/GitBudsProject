const admin = require("firebase-admin");
const serviceAccount = require("../Events/ServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateHealersDisplayNameLowercase() {
  const healersRef = db.collection("healers");
  const snapshot = await healersRef.get();

  if (snapshot.empty) {
    console.log("No healers found.");
    return;
  }

  const batch = db.batch();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const healerData = doc.data();
    const displayName = healerData.displayName;

    if (displayName) {
      const lowercaseDisplayName = displayName.toLowerCase();

      // Update healer's document with lowercase display name
      batch.update(doc.ref, { displayNameLowercase: lowercaseDisplayName });
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Updated ${updatedCount} healers with displayNameLowercase.`);
  } else {
    console.log("🎉 No healers were updated as they already have the lowercase display name.");
  }
}

updateHealersDisplayNameLowercase().catch(console.error);

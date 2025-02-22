const admin = require("firebase-admin");
const serviceAccount = require("./ServiceAccountKey.json"); // Replace with your actual service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateOldEvents() {
  const eventsRef = db.collection("events");
  const snapshot = await eventsRef.get();

  if (snapshot.empty) {
    console.log("No events found.");
    return;
  }

  const batch = db.batch();
  let updatedCount = 0;

  snapshot.forEach((doc) => {
    const eventData = doc.data();

    // Only update if titleLower does not exist
    if (!eventData.titleLower) {
      const titleLower = eventData.title ? eventData.title.toLowerCase() : "";
      batch.update(doc.ref, { titleLower });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Updated ${updatedCount} events.`);
  } else {
    console.log("🎉 All events already have titleLower!");
  }
}

updateOldEvents().catch(console.error);

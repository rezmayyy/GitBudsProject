// Script to add eventType to all events in Firestore

const admin = require("firebase-admin");
const serviceAccount = require("./ServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateEventTypes() {
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

    // Only update if eventType does not exist
    if (!eventData.eventType) {
      batch.update(doc.ref, { eventType: "Local Gathering" });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Updated ${updatedCount} events with eventType: "Local Gathering".`);
  } else {
    console.log("🎉 All events already have an eventType!");
  }
}

updateEventTypes().catch(console.error);

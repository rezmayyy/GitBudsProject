import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase config (replace with your actual credentials)
const firebaseConfig = {
    apiKey: "AIzaSyCldsk9RttWXIFqsZs22_H2Z2Q3MTp4kbI",
    authDomain: "tribewell-d4492.firebaseapp.com",
    projectId: "tribewell-d4492",
    storageBucket: "tribewell-d4492.appspot.com",
    messagingSenderId: "151259052481",
    appId: "1:151259052481:web:69b05a7c36937ac0759740"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign-in credentials (replace with an admin user or a test account)
const email = "jtneal@csus.edu";
const password = "Password";

// Function to sign in before running Firestore queries
async function runScript() {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Signed in as: ${userCredential.user.email}`);
        await cleanUpPosts(); // Start cleanup after signing in
    } catch (error) {
        console.error("Error signing in:", error.message);
    }
}

// Function to fetch displayName based on userId
async function getDisplayName(userID) {
    try {
        const userRef = doc(db, "users", userID);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return userDoc.data().displayName || "UnknownUser";
        }
    } catch (error) {
        console.error(`Error fetching user ${userID}:`, error);
    }

    return "UnknownUser";
}

// Cleanup function to fix author fields and remove userId
async function cleanUpPosts() {
    try {
        const postsRef = collection(db, "content-posts"); // Adjust collection name if needed
        const snapshot = await getDocs(postsRef);

        for (const docSnapshot of snapshot.docs) {
            const post = docSnapshot.data();
            const postId = docSnapshot.id;
            const postRef = doc(db, "content-posts", postId);
            let updatedData = {};

            // If `author` is an object, replace it with just the displayName
            if (post.author && typeof post.author === "object") {
                updatedData.author = post.author.displayName || "UnknownUser";
            }

            // If `author` is missing but `userId` exists, fetch displayName
            if (!post.author && post.userID) {
                const displayName = await getDisplayName(post.userId);
                updatedData.author = displayName;
            }

            // Remove userId if it exists
            if (post.userID) {
                updatedData.userID = null;
            }

            // Apply updates if there are any
            if (Object.keys(updatedData).length > 0) {
                await updateDoc(postRef, updatedData);
                console.log(`Updated post ${postId}:`, updatedData);
            }
        }

        console.log("Cleanup complete!");
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}

// Execute script
runScript();

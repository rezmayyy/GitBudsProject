import { collection, query, where, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../assets/Firebase"; // Ensure this points to your Firebase config

export const getUserIdByDisplayName = async (displayName) => {
    try {
        const usersRef = collection(db, 'users'); // Reference to the users collection
        const q = query(usersRef, where('displayName', '==', displayName)); // Query to find the user by display name
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('No matching user found.');
            return null; // No user found
        }

        // Assuming display names are unique, get the first matching document
        const userDoc = querySnapshot.docs[0];
        return userDoc.id; // The document ID is the user ID
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null; // Handle error appropriately
    }
};

export const getUserById = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        } else {
            console.log(`No user found with ID: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching user document:', error);
        return null;
    }
};
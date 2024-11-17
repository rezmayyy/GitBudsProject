import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const db = getFirestore();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in
                const userRef = doc(db, 'users', firebaseUser.uid); // Assuming your user docs are in the "users" collection
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    // Combine firebaseUser and Firestore user data
                    const userData = { ...firebaseUser, ...userDoc.data() };
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    console.error("No such user in Firestore!");
                    setUser(firebaseUser); // Fall back to just the firebase user
                }
            } else {
                // User is signed out
                setUser(null);
                localStorage.removeItem('user');
            }
            setLoading(false); // Stop loading
        });

        // Check local storage for user
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && !user) {
            setUser(storedUser);
        }

        return () => unsubscribeAuth(); // Clean up the listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db]); // No need for 'user' in the dependency array

    if (loading) {
        return <div>Loading...</div>; // Optional: Show a loading state while fetching user
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;

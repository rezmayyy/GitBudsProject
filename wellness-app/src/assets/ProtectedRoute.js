import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from './Firebase'; // Adjust the path as necessary
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ element: Component }) => {
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if ((userDoc.exists() && userDoc.data().role === 'moderator') || (userDoc.exists() && userDoc.data().role === 'admin')) {
          setIsModerator(true);
        }
      }
      setLoading(false);
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      fetchUserRole();
    });

    return unsubscribe;
  }, []);

  if (loading) return <p>Loading...</p>;

  return isModerator ? <Component /> : <Navigate to="/" />;
};

export default ProtectedRoute;
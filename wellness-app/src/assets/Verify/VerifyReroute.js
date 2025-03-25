import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../Firebase'; // Adjust the import path as needed

const VerifyReroute = ({ element: Element }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return user.emailVerified ? Element : <Navigate to="/verify" />;
};

export default VerifyReroute;

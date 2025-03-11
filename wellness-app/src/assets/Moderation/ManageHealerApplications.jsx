import React, { useEffect, useState } from 'react';
import { db } from '../Firebase'; 
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const ManageHealerApplications = () => {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const q = query(collection(db, 'healerApplications'), where('status', '==', 'pending'));
                const querySnapshot = await getDocs(q);
                const applicationsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setApplications(applicationsData);
            } catch (error) {
                console.error('Error fetching applications:', error);
            }
        };

        fetchApplications();
    }, []);

    const handleApproval = async (app, status) => {
        try {
            const appRef = doc(db, 'healerApplications', app.id);
            const healerRef = doc(db, 'healers', app.userId);

            if (status === 'approved') {
                // ✅ Check if user is already in the healers collection
                const healerSnapshot = await getDoc(healerRef);
                if (!healerSnapshot.exists()) {
                    // ✅ Add approved healer to the healers collection with profilePicUrl and timestamp
                    await setDoc(healerRef, {
                        userId: app.userId,
                        firstName: app.firstName,
                        lastName: app.lastName,
                        title: app.title,
                        location: app.location,
                        healingTags: app.healingTags,
                        displayName: app.displayName,
                        displayNameLowercase: app.displayName.toLowerCase(),
                        profilePicUrl: app.profilePicUrl,  // ✅ Store the profile picture URL
                        approvedAt: Timestamp.now(), // ✅ Store approval timestamp
                    });

                    // ✅ Remove application after approval
                    await deleteDoc(appRef);
                } else {
                    console.log('User is already a healer.');
                }
            } else {
                // ❌ Update status to 'rejected' (keeping record)
                await updateDoc(appRef, { 
                    status: 'rejected',
                    rejectedAt: Timestamp.now() // Store rejection timestamp
                });
            }

            // Refresh applications list
            setApplications(prev => prev.filter(a => a.id !== app.id));
        } catch (error) {
            console.error(`Error ${status} application:`, error);
        }
    };

    return (
        <div>
            <h2>Manage Healer Applications</h2>
            {applications.length === 0 ? (
                <p>No pending applications.</p>
            ) : (
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Healing Tags</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app.id}>
                                <td>{app.firstName} {app.lastName}</td>
                                <td>{app.title}</td>
                                <td>{app.location}</td>
                                <td>{app.healingTags.join(', ')}</td>
                                <td>
                                    <button onClick={() => handleApproval(app, 'approved')}>Approve</button>
                                    <button onClick={() => handleApproval(app, 'rejected')}>Reject</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageHealerApplications;

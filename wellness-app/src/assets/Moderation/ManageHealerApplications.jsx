// ManageHealerApplications.jsx
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
                setApplications(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
                const healerSnapshot = await getDoc(healerRef);
                if (!healerSnapshot.exists()) {
                    await setDoc(healerRef, {
                        userId: app.userId,
                        firstName: app.firstName,
                        lastName: app.lastName,
                        title: app.title,
                        location: app.location,
                        healingTags: app.healingTags,
                        approvedAt: Timestamp.now(),
                    });
                    // Only update role field on users collection
                    await updateDoc(doc(db, 'users', app.userId), { role: 'healer' });
                    await deleteDoc(appRef);
                }
            } else {
                await updateDoc(appRef, { status: 'rejected', rejectedAt: Timestamp.now() });
            }

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

// src/components/ManageMods.jsx
import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../Firebase';
import styles from '../../styles/ModDashboard.module.css';

const ManageMods = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // run search when query is at least 3 chars
    useEffect(() => {
        if (searchQuery.length > 2) {
            searchUsers(searchQuery);
        } else {
            setUsers([]);
        }
    }, [searchQuery]);

    // search by email, displayName, or UID
    const searchUsers = async (qStr) => {
        const userRef = collection(db, 'users');
        const emailQ = query(userRef,
            where('email', '>=', qStr),
            where('email', '<=', qStr + '\uf8ff')
        );
        const nameQ = query(userRef,
            where('displayName', '>=', qStr),
            where('displayName', '<=', qStr + '\uf8ff')
        );
        const [emailSnap, nameSnap, allSnap] = await Promise.all([
            getDocs(emailQ),
            getDocs(nameQ),
            getDocs(userRef)
        ]);

        // by UID
        const byId = allSnap.docs
            .filter(docSnap => docSnap.id.includes(qStr))
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        // combine unique
        const combined = [
            ...emailSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...nameSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            ...byId
        ];
        const unique = Array.from(
            new Map(combined.map(u => [u.id, u])).values()
        );

        setUsers(unique);
    };

    // when you click "View User", load both public and privateInfo sub‐doc
    const handleViewUser = async (uid) => {
        const userSnap = await getDoc(doc(db, 'users', uid));
        const privateSnap = await getDoc(doc(db, 'users', uid, 'privateInfo', 'info'));

        if (!userSnap.exists()) return;
        const publicData = userSnap.data();
        const privateData = privateSnap.exists() ? privateSnap.data() : {};

        setSelectedUser({
            id: uid,
            displayName: publicData.displayName,
            bio: publicData.bio || '',
            // pull from privateInfo if available, else fall back
            email: privateData.email || publicData.email || 'Unavailable',
            interests: privateData.interests || '',
            contacts: privateData.contacts || '',
            role: publicData.role || ''
        });
    };

    // change role and call the "setAdmin" cloud fn if needed
    const changeRole = async (userId, newRole) => {
        if (!window.confirm(`Set user ${userId} as ${newRole}?`)) return;
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            if (newRole === 'admin') {
                const setAdminFn = httpsCallable(functions, 'setAdmin');
                await setAdminFn({ uid: userId });
            }
            alert(`User is now ${newRole}`);
            setSelectedUser(prev => prev && ({ ...prev, role: newRole }));
        } catch (err) {
            console.error('Error changing role:', err);
            alert('Failed to change role.');
        }
    };

    return (
        <div className={styles.manageUsers}>
            <h2>Manage Admins & Mods</h2>
            <input
                type="text"
                placeholder="Search by email, displayName, or UID"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
            />

            <div className={styles.userList}>
                {users.length > 0 && (
                    <ul>
                        {users.map(u => (
                            <li key={u.id} className={styles.userItem}>
                                <span>{u.displayName || u.id}</span>
                                <button
                                    onClick={() => handleViewUser(u.id)}
                                    className={styles.viewButton}
                                >
                                    View User
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedUser && (
                <div className={styles.userDetails}>
                    <h3>{selectedUser.displayName}'s Profile</h3>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Bio:</strong> {selectedUser.bio || '—'}</p>
                    <p><strong>Interests:</strong> {selectedUser.interests || '—'}</p>
                    <p><strong>Contacts:</strong> {selectedUser.contacts || '—'}</p>
                    <p><strong>Current Role:</strong> {selectedUser.role}</p>
                    <div className={styles.buttonRow}>
                        <button
                            onClick={() => changeRole(selectedUser.id, 'admin')}
                            className={styles.banButton}
                        >
                            Set As Admin
                        </button>
                        <button
                            onClick={() => changeRole(selectedUser.id, 'moderator')}
                            className={styles.banButton}
                        >
                            Set As Moderator
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMods;

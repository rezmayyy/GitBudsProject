import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../Firebase'; // Make sure functions is exported from your Firebase.js
import styles from '../../styles/ModDashboard.module.css';

const ManageMods = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (searchQuery.length > 2) searchUsers(searchQuery);
        else setUsers([]);
    }, [searchQuery]);

    const searchUsers = async (qStr) => {
        const userRef = collection(db, 'users');
        const emailQ = query(userRef, where('email', '>=', qStr), where('email', '<=', qStr + '\uf8ff'));
        const nameQ = query(userRef, where('displayName', '>=', qStr), where('displayName', '<=', qStr + '\uf8ff'));
        const [emailSnap, nameSnap] = await Promise.all([getDocs(emailQ), getDocs(nameQ)]);
        const byId = (await getDocs(userRef)).docs
            .filter(docSnap => docSnap.id.includes(qStr))
            .map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));

        setUsers([
            ...emailSnap.docs.map(d => ({ ...d.data(), id: d.id })),
            ...nameSnap.docs.map(d => ({ ...d.data(), id: d.id })),
            ...byId,
        ]);
    };

    const handleViewUser = async (userId) => {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) setSelectedUser({ id: userId, ...userSnap.data() });
    };

    const changeRole = async (userId, newRole) => {
        if (!window.confirm(`Set user as ${newRole}?`)) return;

        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });

            if (newRole === 'admin') {
                const setAdminFn = httpsCallable(functions, 'setAdmin');
                await setAdminFn({ uid: userId });
            }

            alert(`User is now ${newRole}`);
            setSelectedUser(prev => prev && { ...prev, role: newRole });
        } catch (err) {
            console.error(`Failed to set ${newRole}`, err);
            alert('Error updating role.');
        }
    };

    return (
        <div className={styles.manageUsers}>
            <h2>Manage Admins & Mods</h2>
            <input
                className={styles.searchInput}
                type="text"
                placeholder="Search by email, display name, or user ID"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />

            <div className={styles.userList}>
                {users.length > 0 && (
                    <ul>
                        {users.map(u => (
                            <li key={u.id} className={styles.userItem}>
                                <span>{u.email}</span>
                                <button onClick={() => handleViewUser(u.id)} className={styles.viewButton}>
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
                    <p>Email: {selectedUser.email}</p>
                    <p>Bio: {selectedUser.bio || '—'}</p>
                    <div>
                        <button onClick={() => changeRole(selectedUser.id, 'admin')} className={styles.unbanButton}>
                            Set As Admin
                        </button>
                        <button onClick={() => changeRole(selectedUser.id, 'moderator')} className={styles.unbanButton}>
                            Set As Moderator
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMods;

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db, functions } from './Firebase'; // Firebase setup
import { httpsCallable } from 'firebase/functions';
import styles from '../styles/ModDashboard.module.css'; // Import CSS for styling

const ModDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPunishments, setUserPunishments] = useState([]);
  const [message, setMessage] = useState('');
  const [showWidget, setShowWidget] = useState(true); // Controls the widget visibility

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchUsers(searchQuery);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async (queryStr) => {
    try {
      const userRef = collection(db, 'users');

      const emailQuery = query(
        userRef,
        where('email', '>=', queryStr),
        where('email', '<=', queryStr + '\uf8ff')
      );

      const displayNameQuery = query(
        userRef,
        where('displayName', '>=', queryStr),
        where('displayName', '<=', queryStr + '\uf8ff')
      );

      const [emailResults, displayNameResults] = await Promise.all([
        getDocs(emailQuery),
        getDocs(displayNameQuery),
      ]);

      const userSnap = await getDocs(userRef);
      const userIdResults = userSnap.docs.filter(doc => doc.id.includes(queryStr));
      const matchingUserIds = userIdResults.map(doc => ({ ...doc.data(), id: doc.id }));

      const matchingUsers = [
        ...emailResults.docs.map(doc => ({ ...doc.data(), id: doc.id })),
        ...displayNameResults.docs.map(doc => ({ ...doc.data(), id: doc.id })),
        ...matchingUserIds,
      ];

      setUsers(matchingUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedUser(docSnap.data());
        const punishmentsRef = db.collection('users').doc(userId).collection('punishments');
        const punishmentsSnap = await punishmentsRef.get();
        const punishmentsList = punishmentsSnap.docs.map(doc => doc.data());
        setUserPunishments(punishmentsList);
      }
    } catch (error) {
      console.error('Error viewing user:', error);
    }
  };

  const handleBanUser = async (userId) => {
    const duration = prompt('Enter ban duration in days:');
    if (!duration) return;

    const banUser = httpsCallable(functions, 'banUser');
    try {
      const result = await banUser({ userId, duration: parseInt(duration) });
      alert(result.data.message);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user.');
    }
  };

  const handleUnbanUser = async (userId) => {
    const unbanUser = httpsCallable(functions, 'unbanUser');
    try {
      const result = await unbanUser({ userId });
      alert(result.data.message);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban user.');
    }
  };

  return (
    <div className={styles.modDashboard}>
      <h2>Moderator Dashboard</h2>

      {/* Conditionally render the widget */}
      {showWidget && (
        <div className={styles.searchWidget}>
          <input
            type="text"
            placeholder="Search by email, display name, or user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.userList}>
            {users.length > 0 && (
              <ul>
                {users.map((user) => (
                  <li key={user.id} className={styles.userItem}>
                    <span>{user.email}</span>
                    <button onClick={() => handleViewUser(user.id)} className={styles.viewButton}>
                      View User
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className={styles.userDetails}>
          <h3>{selectedUser.displayName}'s Profile</h3>
          <p>Email: {selectedUser.email}</p>
          <p>Bio: {selectedUser.bio}</p>
          <div className={styles.punishments}>
            <h4>Punishments:</h4>
            {userPunishments.length > 0 ? (
              <ul>
                {userPunishments.map((punishment, index) => (
                  <li key={index} className={styles.punishmentItem}>
                    <p>Duration: {punishment.duration} days</p>
                    <p>Reason: {punishment.reason}</p>
                    <p>Status: {punishment.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No punishments found.</p>
            )}
          </div>
          <div>
            <button onClick={() => handleBanUser(selectedUser.id)} className={styles.banButton}>
              Ban User
            </button>
            <button onClick={() => handleUnbanUser(selectedUser.id)} className={styles.unbanButton}>
              Unban User
            </button>
          </div>
        </div>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ModDashboard;

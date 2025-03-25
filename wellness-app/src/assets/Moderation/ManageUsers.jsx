import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db, functions } from '../Firebase'; // Adjust the path as needed
import { httpsCallable } from 'firebase/functions';
import styles from '../../styles/ModDashboard.module.css';

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPunishments, setUserPunishments] = useState([]);
  const [message, setMessage] = useState('');

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

      // Search by email
      const emailQuery = query(
        userRef,
        where('email', '>=', queryStr),
        where('email', '<=', queryStr + '\uf8ff')
      );

      // Search by displayName
      const displayNameQuery = query(
        userRef,
        where('displayName', '>=', queryStr),
        where('displayName', '<=', queryStr + '\uf8ff')
      );

      const [emailResults, displayNameResults] = await Promise.all([
        getDocs(emailQuery),
        getDocs(displayNameQuery)
      ]);

      // Also filter by user ID (document ID) if it includes the query string
      const allDocsSnap = await getDocs(userRef);
      const userIdResults = allDocsSnap.docs
        .filter(docSnap => docSnap.id.includes(queryStr))
        .map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));

      const matchingUsers = [
        ...emailResults.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id })),
        ...displayNameResults.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id })),
        ...userIdResults
      ];

      setUsers(matchingUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setSelectedUser({ ...userDocSnap.data(), id: userId });
        // Fetch punishments for the user
        const punishmentsRef = collection(db, 'users', userId, 'punishments');
        const punishmentsSnap = await getDocs(punishmentsRef);
        const punishmentsList = punishmentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setUserPunishments(punishmentsList);
      }
    } catch (error) {
      console.error('Error viewing user:', error);
    }
  };

  const handleBanUser = async (userId) => {

    const duration = prompt('Enter ban duration in days:');
    if (!duration) return;
    const reason = prompt('Enter a reason for the ban:');
    if (!reason) return;
    const banUser = httpsCallable(functions, 'banUser');
    try {
      const result = await banUser({ userId, duration: parseInt(duration), reason });
      alert(result.data.message);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban the user.');
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
    <div className={styles.manageUsers}>
      <h2>Manage Users</h2>
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

      {selectedUser && (
        <div className={styles.userDetails}>
          <h3>{selectedUser.displayName}'s Profile</h3>
          <p>Email: {selectedUser.email}</p>
          <p>Bio: {selectedUser.bio}</p>
          <div className={styles.punishments}>
            <h4>Punishments:</h4>
            {userPunishments.length > 0 ? (
              <ul>
                {userPunishments.map((punishment) => (
                  <li key={punishment.id} className={styles.punishmentItem}>
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

export default ManageUsers;

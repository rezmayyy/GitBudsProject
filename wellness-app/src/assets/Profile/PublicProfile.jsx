import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../Firebase';
import UserContext from '../UserContext';
import dummyPic from '../dummyPic.jpeg';
import styles from '../../styles/profile.module.css';

const PublicProfile = () => {
  const { userId } = useParams(); // The public user's ID
  const { user } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userId) return;
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfileData(userSnap.data());
        } else {
          console.log('No such user in Firestore!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkSubscription = async () => {
      if (!user || !userId) return;
      try {
        const subscriptionRef = doc(db, `users/${user.uid}/subscriptions`, userId);
        const subscriptionSnap = await getDoc(subscriptionRef);
        setIsSubscribed(subscriptionSnap.exists());
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    fetchProfile();
    checkSubscription();
  }, [userId, user]);

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please log in to subscribe.');
      return;
    }
    try {
      if (isSubscribed) {
        // Unsubscribe logic
        await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, userId));
        await deleteDoc(doc(db, `users/${userId}/subscribers`, user.uid));
        setIsSubscribed(false);
      } else {
        // Subscribe logic
        await setDoc(doc(db, `users/${user.uid}/subscriptions`, userId), {
          userID: user.uid,
          timestamp: Timestamp.now(),
        });
        await setDoc(doc(db, `users/${userId}/subscribers`, user.uid), {
          userID: user.uid,
          timestamp: Timestamp.now(),
        });
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    }
  };

  if (loading) {
    return <div>Loading user data...</div>;
  }

  if (!profileData) {
    return <div>User not found.</div>;
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileBanner}>
        <div className={styles.profileImageWrapper}>
          <img
            src={profileData.profilePicUrl || dummyPic}
            alt={`${profileData.displayName || 'User'}'s profile`}
            className={styles.profileImage}
          />
        </div>
      </div>

      <div className={styles.profileHeader}>
        <h2>{profileData.displayName || 'Unknown User'}</h2>
      </div>

      <div className={styles.contentArea}>
        <p><strong>Email:</strong> {profileData.email || 'No email provided'}</p>
        <p><strong>Bio:</strong> {profileData.bio || 'No bio provided'}</p>
        <p><strong>Interests:</strong> {profileData.interests || 'No interests provided'}</p>
      </div>

      {/* Only show the subscribe button if the logged-in user is not viewing their own profile */}
      {user && user.uid !== userId && (
        <button onClick={handleSubscribe} className="subscribe-button">
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      )}
    </div>
  );
};

export default PublicProfile;

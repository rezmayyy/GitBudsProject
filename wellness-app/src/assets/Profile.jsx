import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserContext from './UserContext';
import { db, storage, functions } from './Firebase'; // Import Firebase functions
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions'; // Import for calling functions
import '../styles/profile.css';
import styles from '../styles/UserPage.module.css';
import dummyPic from "./dummyPic.jpeg";
import { connectFunctionsEmulator } from 'firebase/functions';

// Connect to emulator (only use this for local development)
connectFunctionsEmulator(functions, "localhost", 5001);


const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('about');
  const [profileData, setProfileData] = useState({
    email: '',
    displayName: '',
    bio: '',
    interests: '',
    profilePicUrl: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [message, setMessage] = useState('');
  const [postFilter, setPostFilter] = useState('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleFilterChange = (filter) => setPostFilter(filter);

  const isCurrentUser = userId === user?.uid || !userId;

  // Fetch profile data and check user role
  useEffect(() => {
    const fetchProfile = async () => {
      const uid = userId || user?.uid;
      if (uid) {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
          setTempProfileData(docSnap.data());
        }
      }
    };

    const checkSubscription = async () => {
      if (user && userId) {
        const subscriptionRef = doc(db, `users/${user.uid}/subscriptions`, userId);
        const docSnap = await getDoc(subscriptionRef);
        setIsSubscribed(docSnap.exists());
      }
    };

    const checkUserRole = async () => {
      if (user) {
        const currentUserRef = doc(db, 'users', user.uid);
        const currentUserSnap = await getDoc(currentUserRef);
        if (currentUserSnap.exists()) {
          const currentUserData = currentUserSnap.data();
          setIsAdminOrModerator(currentUserData.role === 'admin' || currentUserData.role === 'moderator');
        }
      }
    };

    fetchProfile();
    checkSubscription();
    checkUserRole();
  }, [userId, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempProfileData({ ...tempProfileData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
    }
  };

  // Save profile updates to Firestore and Storage
  const handleSave = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, tempProfileData, { merge: true });

      // Handle profile picture upload
      if (profilePicFile) {
        const profilePicRef = ref(storage, `profile_pics/${user.uid}/${profilePicFile.name}`);
        await uploadBytes(profilePicRef, profilePicFile);
        const profilePicUrl = await getDownloadURL(profilePicRef);
        await setDoc(docRef, { profilePicUrl }, { merge: true });
        setProfileData((prev) => ({ ...prev, profilePicUrl }));
      }

      setProfileData(tempProfileData);
      setEditMode(false);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Try again later.');
    }
  };

  const handleCancel = () => {
    setTempProfileData(profileData);
    setEditMode(false);
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        // Unsubscribe logic
        await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, userId));
        await deleteDoc(doc(db, `users/${userId}/subscribers`, user.uid));
        setIsSubscribed(false);
      } else {
        // Subscribe logic
        await setDoc(doc(db, `users/${user.uid}/subscriptions`, userId), {
          userID: userId,
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

  // Handle banning a user
  const handleBanUser = async () => {
    const duration = prompt('Enter ban duration in days:');
    if (!duration) return;
  
    const reason = prompt('Enter a reason for the ban:');
    if (!reason) return;
  
    const banUser = httpsCallable(functions, 'banUser');
  
    try {
      const result = await banUser({ userId: userId, duration: parseInt(duration), reason: reason });
      alert(result.data.message);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban the user. Please try again. (Server functions require firebase blaze)');
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        {profileData.profilePicUrl ? (
          <img src={profileData.profilePicUrl} alt="Profile" className="profile-pic" />
        ) : (
          <img src={dummyPic} alt="Profile" className="profile-pic" />
        )}
        <h2>{profileData.displayName || 'User Profile'}</h2>

        {!isCurrentUser && user ? (
          <button 
            className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`} 
            onClick={handleSubscribe}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        ) : !isCurrentUser && (
          <p className="login-message">Please log in to subscribe</p>
        )}
      </div>

      {/* Admin/Moderator-specific actions */}
      {isAdminOrModerator && !isCurrentUser && (
        <button onClick={handleBanUser} className="ban-user-btn">Ban User</button>
      )}

      <div className={styles.navLinks}>
        <button 
          onClick={() => handleTabClick('posts')} 
          className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}
        >
          Posts
        </button>
        <button 
          onClick={() => handleTabClick('about')} 
          className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}
        >
          About
        </button>
        <button 
          onClick={() => handleTabClick('contact')} 
          className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}
        >
          Contact
        </button>
      </div>
      
      <div className={styles.contentArea}>
        {/* Content rendering based on active tab */}
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase';
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import styles from '../../styles/profile.module.css';
import dummyPic from "../dummyPic.jpeg";
import ProfilePosts from './ProfilePosts';
import ProfileVideos from './ProfileVideos';
import ProfileAudio from './ProfileAudio';
import ProfileText from './ProfileText';


// Connect to emulator (only use this for local development)
connectFunctionsEmulator(functions, "localhost", 5001);


const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const [profileData, setProfileData] = useState({
    email: '',
    displayName: '',
    bio: '',
    interests: '',
    profilePictureUrl: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // Initialize activeTab
  const [reason, setReason] = useState(''); // State for report reason
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  const [message, setMessage] = useState('');
  const isCurrentUser = userId === user?.uid || !userId;
  const navigate = useNavigate();

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

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    }
  };

  // Save profile updates to Firestore and Storage
  const handleSave = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, tempProfileData, { merge: true });

      // Handle profile picture upload
      if (profilePictureFile) {
        const profilePictureRef = ref(storage, `profile_pics/${user.uid}/${profilePictureFile.name}`);
        await uploadBytes(profilePictureRef, profilePictureFile);
        const profilePictureUrl = await getDownloadURL(profilePictureRef);
        await setDoc(docRef, { profilePictureUrl }, { merge: true });
        setProfileData((prev) => ({ ...prev, profilePictureUrl }));
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

  // Handle reports
  const handleReport = async () => {
    const reason = prompt('Enter a reason for the report:');
    if (!reason) return;

    const reportUser = httpsCallable(functions, 'reportUser');

    try {
      const result = await reportUser({ userId: userId, reason: reason });
      alert(result.data.message);
    } catch (error) {
      console.error('Error reporting user:', error);
      alert('Failed to report the user. Please try again. (Server functions require firebase blaze)');
    }
  }

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

  // Handle unbanning a user
  const handleUnbanUser = async () => {
    const unbanUser = httpsCallable(functions, 'unbanUser');

    try {
      const result = await unbanUser({ userId: userId });
      alert(result.data.message);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban the user. Please try again. (Server functions require firebase blaze)');
    }

  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileBanner}>
        <div className={styles.profileImageWrapper}>
          <img
            src={profileData.profilePictureUrl || dummyPic}
            alt={`${profileData.displayName || 'User'}'s profile`}
            className={styles.profileImage}
          />
        </div>
        <button className={styles.profileButton}>Change Profile Picture</button>
      </div>

      <div className={styles.profileHeader}>
        <h2>{profileData.displayName || 'User Profile'}</h2>

        {/* Button for adding a new diary entry */}
        {isCurrentUser && (
          <button className="btn btn-primary mt-3" onClick={() => navigate('/profile/diary')}>View My Diary</button>
        )}


        {!isCurrentUser && user ? (
          <button
            className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        ) : !isCurrentUser && (
          <p className="login-message">Please log in to subscribe.</p>
        )}

        {/* Admin/Moderator-specific actions */}
        {isAdminOrModerator && !isCurrentUser && (
          <button onClick={handleBanUser} className={styles.profileButton}>Ban User</button>
        )}
      </div>

      <div className={styles.navLinks}>
        <button onClick={() => setActiveTab('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
        <button onClick={() => setActiveTab('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
        <button onClick={() => setActiveTab('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
        <button onClick={() => setActiveTab('report')} className={`${styles.navButton} ${activeTab === 'report' ? styles.active : ''}`}>Report</button>
      </div>

      <div className={styles.contentArea}>
        {/* Render content based on the active tab */}
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

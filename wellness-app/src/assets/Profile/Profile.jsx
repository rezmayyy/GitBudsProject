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
import ProfileArticles from './ProfileArticles';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Connect to emulator (only use this for local development)
connectFunctionsEmulator(functions, "localhost", 5001);

const Profile = () => {
  const { user } = useContext(UserContext);
  const { uid} = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    email: '',
    displayName: '',
    bio: '',
    interests: '',
    profilePictureUrl: ''
  });

  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // set default tab state to posts
  const [activeSubTab, setActiveSubTab] = useState('videos'); // set default sub-tab state to videos
  const [reason, setReason] = useState(''); // State for report reason
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  const [message, setMessage] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [viewedUserId, setViewedUserId] = useState(null);

  // Fetch profile data and check user role
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      let targetUid;
      if (!uid) {
        targetUid = user.uid;
        setIsCurrentUser(true);
      } else {
        targetUid = uid;
        setIsCurrentUser(uid === user.uid);
      }

      const docRef = doc(db, 'users', targetUid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setProfileData(userData);
        setTempProfileData(userData);
        setProfilePicturePreview(userData.profilePicUrl || dummyPic);
        setViewedUserId(targetUid);
      } else {
        console.log("User not found");
        setIsCurrentUser(false);
      }
  };

    const checkSubscription = async () => {
      if (user && viewedUserId && viewedUserId !== user.uid) {
        const subscriptionRef = doc(db, `users/${user.uid}/subscriptions`, viewedUserId);
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
  }, [user, uid, viewedUserId]);

  useEffect(() => {
    if (!uid && user?.displayName) {
      navigate(`/profile/${user.uid}`);
    }
  }, [user, uid, navigate]);

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file)); // Create a preview URL
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
        const profilePicUrl = await getDownloadURL(profilePictureRef);
        await setDoc(docRef, { profilePicUrl }, { merge: true });
        setProfileData((prev) => ({ ...prev, profilePicUrl }));
      }
  
      setProfileData(tempProfileData);
      setMessage('Profile updated successfully!');
  
      // Reload page after successful update
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Try again later.');
    }
  };

  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        // Unsubscribe logic
        await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, viewedUserId));
        await deleteDoc(doc(db, `users/${viewedUserId}/subscribers`, user.uid));
        setIsSubscribed(false);
      } else {
        // Subscribe logic
        await setDoc(doc(db, `users/${user.uid}/subscriptions`, viewedUserId), {
          userID: user.uid,
          timestamp: Timestamp.now(),
        });
        await setDoc(doc(db, `users/${viewedUserId}/subscribers`, user.uid), {
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
      const result = await reportUser({ userId: viewedUserId, reason: reason });
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
      const result = await banUser({ userId: viewedUserId, duration: parseInt(duration), reason: reason });
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
      const result = await unbanUser({ userId: viewedUserId });
      alert(result.data.message);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban the user. Please try again. (Server functions require firebase blaze)');
    }
  };

  const handleMainTabClick = (tab) => {
    setActiveTab(tab);
    if (tab !== 'posts') {
      setActiveSubTab(activeSubTab); // remember state of active sub tab
    }
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileBanner}>
        <div className={styles.profileImageWrapper}>
          <img
            src={profilePicturePreview || profileData.profilePictureUrl || dummyPic}
            alt={`${profileData.displayName || 'User'}'s profile`}
            className={styles.profileImage}
          />
        </div>
        {/* Show profile picture change button only if it's the current user's profile */}
          {isCurrentUser && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ display: 'none' }}
                id="profilePicUpload"
              />
              <button 
                className={styles.profileButton} 
                onClick={() => document.getElementById('profilePicUpload').click()}
              >
                Change Profile Picture
              </button>
              {profilePictureFile && (
                <button className={styles.profileButton} onClick={handleSave}>
                  Save Changes
                </button>
              )}
            </>
          )}
      </div>

      <div className={styles.profileHeader}>
        <h2>{profileData.displayName || 'User Profile'}</h2>

        {/* Button for adding a new diary entry */}
        {isCurrentUser && (
          <button className="diaryButton" onClick={() => navigate('/profile/diary')}>View My Diary</button>
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
        <button onClick={() => handleMainTabClick('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
        <button onClick={() => handleMainTabClick('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
        <button onClick={() => handleMainTabClick('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'posts' && (
          <div className={styles.subNavLinks}>
            <button onClick={() => setActiveSubTab('videos')} className={`${styles.subNavButton} ${activeSubTab === 'videos' ? styles.active : ''}`}>Videos</button>
            <button onClick={() => setActiveSubTab('audio')} className={`${styles.subNavButton} ${activeSubTab === 'audio' ? styles.active : ''}`}>Audio</button>
            <button onClick={() => setActiveSubTab('articles')} className={`${styles.subNavButton} ${activeSubTab === 'articles' ? styles.active : ''}`}>Articles</button>
          </div>
        )}

        {activeTab === 'posts' && (
          activeSubTab === 'videos' ? <ProfileVideos /> :
          activeSubTab === 'audio' ? <ProfileAudio /> :
          activeSubTab === 'articles' ? <ProfileArticles /> :
          <></>
        )}
        {activeTab === 'about' && <p>About Content</p>}
        {activeTab === 'contact' && <p>Contact Content</p>}
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

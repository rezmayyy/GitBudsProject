import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase'; // Import Firebase functions
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions'; // Import for calling functions
import styles from '../../styles/profile.css';
import dummyPic from "../dummyPic.jpeg";
import ProfilePosts from './ProfilePosts';
import ProfileVideos from './ProfileVideos';
import ProfileAudio from './ProfileAudio';
import ProfileText from './ProfileText';

import { connectFunctionsEmulator } from 'firebase/functions';

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
  const [hasShop] = useState(true);

  const isCurrentUser = userId === user?.uid || !userId;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const [postFilter, setPostFilter] = useState('all');
  const handleFilterChange = (filter) => setPostFilter(filter);

  const [message, setMessage] = useState('');

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

    const [activeTab, setActiveTab] = useState('posts');
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileBanner}>
        <div className={styles.profileImageWrapper}>
          <img
            src={profileImage || dummyPic} // Use dummyPic as the default profile picture
            alt={`${username}'s profile`}
            className={styles.profileImage}
          />
        </div>
        <button className={styles.profileButton}>Change Profile Picture</button>
      </div>

      <div className={styles.profileHeader}>
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
          <p className="login-message">Please log in to subscribe.</p>
        )}

        {/* Admin/Moderator-specific actions */}
        {isAdminOrModerator && !isCurrentUser && (
          <button onClick={handleBanUser} className={styles.profileButton}>Ban User</button>
        )}
      </div>

      <div className={styles.navLinks}>
        <button onClick={() => handleTabClick('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
        {hasShop && (
          <button onClick={() => handleTabClick('shop')} className={`${styles.navButton} ${activeTab === 'shop' ? styles.active : ''}`}>Shop</button>
        )}
        <button onClick={() => handleTabClick('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
        <button onClick={() => handleTabClick('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
        <button onClick={() => handleTabClick('report')} className={`${styles.navButton} ${activeTab === 'report' ? styles.active : ''}`}>Report</button>
        {isMod && (
          <button onClick={() => handleTabClick('modview')} className={`${styles.navButton} ${activeTab === 'modview' ? styles.active : ''}`}>ModView</button>
        )}
      </div>

      <div className={styles.contentArea}>
        {activeTab === 'posts' && (
          <div className="posts">
            <div className={styles.dropdown}>
              <label>Filter by:</label>
              <select
                className={styles.dropdownSelect}
                value={postFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="all">All</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div className={styles.postsContainer}>
              <p>Displaying {postFilter} posts for {username}...</p>

              // Display all posts
              {postFilter == "all" && (
                <div id="profilePosts">
                  <ProfilePosts />
                </div>
              )}

              // Display videos only
              {postFilter == "video" && (
                <div id="profileVideos">
                  <ProfileVideos />
                </div>
              )}

              // Display audio only
              {postFilter == "audio" && (
                <div id="userAudio">
                  <ProfileAudio />
                </div>
              )}

              // Display text only
              {postFilter == "text" && (
                <div id="userText">
                  <ProfileText />
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className={styles.shopSection}>
            <h3>{username}'s Shop</h3>
            <div className={styles.productGrid}>
              {[1, 2, 3].map((product) => (
                <div key={product} className={styles.productCard}>
                  <img
                    src="https://via.placeholder.com/100"
                    alt="Product Preview"
                    className={styles.productImage}
                  />
                  <div className={styles.productInfo}>
                    <p className={styles.productName}>Product {product}</p>
                    <p className={styles.productPrice}>$10.00</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className={styles.aboutSection}>
            <h3>About {username}</h3>
            <p>Biography: {bio}</p>
            <p>Interests: {interests}</p>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className={styles.contactSection}>
            <h3>Contact {username}</h3>
            <p>Email: {email}</p>
            <FaEnvelope className="icon" />
          </div>
        )}

        {activeTab === 'report' && (
          <div className={styles.reportSection}>
            <h3>Report {username}</h3>
            <form className="report-form" onSubmit={handleReport}>
              <p>If you believe {username} is in violation of our <link ref="/TOS" className={styles.link}>Terms of Service</link>, explain why.</p>
              <input
                type="text"
                placeholder="Type reason here..."
                value={reason}
                required
              />
              <button className={styles.profileButton} type="submit">Submit Report</button>
            </form>
          </div>
        )}

        {activeTab === 'modview' && (
          <div className={styles.modSection}>
            <h3>ModView</h3>
            <button className={styles.profileButton} onClick={handleBanUser}>Ban User</button>
            <button className={styles.profileButton} onClick={handleUnbanUser}>Unban User</button>
          </div>
        )}
      </div>

      {message && <p className="message">{message}</p>};
    </div>
  );
};

export default Profile;

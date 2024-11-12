import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserContext from './UserContext';
import { db, storage } from './Firebase';
import { doc, getDoc, setDoc, Timestamp, deleteDoc} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../styles/profile.css';
import styles from '../styles/UserPage.module.css';
import dummyPic from "./dummyPic.jpeg";

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
  
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  const handleFilterChange = (filter) => setPostFilter(filter);
  const isCurrentUser = userId === user?.uid || !userId; 

  // Fetch profile data based on userId 
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
    fetchProfile();
    checkSubscription();
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
        // Your existing subscribe logic
        await setDoc(doc(db, `users/${user.uid}/subscriptions`, userId),
          {
            userID: userId,
            timestamp: Timestamp.now()
          }
        );
        await setDoc(doc(db, `users/${userId}/subscribers`, user.uid),
          {
            userID: user.uid,
            timestamp: Timestamp.now()
          }
        );
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
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

      <div className={styles.navLinks}>
                <button onClick={() => handleTabClick('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
                <button onClick={() => handleTabClick('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
                <button onClick={() => handleTabClick('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
            </div>
            <div className={styles.contentArea}>
                {activeTab === 'posts' && (
                    <div>
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
                            <p>Displaying {postFilter} posts for {profileData.displayName}...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className={styles.aboutSection}>
                             <div className="profile-info">
        {editMode && isCurrentUser ? (
          <>
            <label>
              Display Name:
              <input
                type="text"
                name="displayName"
                value={tempProfileData.displayName || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Bio:
              <textarea
                name="bio"
                value={tempProfileData.bio || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Interests:
              <textarea
                name="interests"
                value={tempProfileData.interests || ''}
                onChange={handleChange}
              />
            </label>
            <label>
              Profile Picture:
              <input type="file" onChange={handleFileChange} />
            </label>
            <div className="profile-buttons">
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Bio:</strong> {profileData.bio || 'No bio available'}</p>
            <p><strong>Interests:</strong> {profileData.interests || 'No interests available'}</p>
            {isCurrentUser && !editMode && (
              <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                Update Profile
              </button>
            )}
          </>
        )}
      </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className={styles.contactSection}>
                        <h3>Contact {profileData.displayName}</h3>
                        <p className="profile-email">{profileData.email || 'No email available'}</p>
                    </div>
                )}

                
            </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

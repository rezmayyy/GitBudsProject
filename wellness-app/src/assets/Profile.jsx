import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserContext from './UserContext';
import { db, storage } from './Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../styles/profile.css';

const Profile = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams(); 
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
    fetchProfile();
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

  return (
    <div className="profile-page">
      <div className="profile-header">
        {profileData.profilePicUrl ? (
          <img src={profileData.profilePicUrl} alt="Profile" className="profile-pic" />
        ) : (
          <img src="https://via.placeholder.com/150" alt="Profile" className="profile-pic" />
        )}
        <h2>{profileData.displayName || 'User Profile'}</h2>
        <p className="profile-email">{profileData.email || 'No email available'}</p>
      </div>
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
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

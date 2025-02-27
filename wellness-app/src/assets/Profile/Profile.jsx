// Profile.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase';
import { 
  doc, getDoc, setDoc, Timestamp, deleteDoc, 
  collection, query, where, getDocs 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import styles from '../../styles/profile.module.css';
import dummyPic from "../dummyPic.jpeg";
import ProfilePosts from './ProfilePosts';
import HealerServices from './healerServices'; // New module for healers

const Profile = () => {
  const { user } = useContext(UserContext);
  const { username } = useParams(); // Visited user's displayName
  const navigate = useNavigate();

  // STATE: Visited user's data and document ID
  const [profileData, setProfileData] = useState(null);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [visitedUserDoc, setVisitedUserDoc] = useState(null);

  // STATE: UI flags and messages
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  const [message, setMessage] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // STATE: Editing About
  const [editingAbout, setEditingAbout] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newInterests, setNewInterests] = useState('');

  // STATE: Editing Contact (contacts array)
  const [editingContact, setEditingContact] = useState(false);
  const [contacts, setContacts] = useState([]);

  // --- 1. Fetch the visited user's document based on username ---
  useEffect(() => {
    const fetchVisitedUser = async () => {
      if (!username) return;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Assume displayName is unique; use the first document.
          const userDoc = querySnapshot.docs[0];
          const visitedData = { ...userDoc.data(), id: userDoc.id };
          setViewedUserId(userDoc.id);
          setVisitedUserDoc(visitedData);
          setProfileData(visitedData);
          setProfilePicturePreview(visitedData.profilePicUrl || dummyPic);
          // Initialize editing fields
          setNewBio(visitedData.bio || '');
          setNewInterests(visitedData.interests || '');
          setContacts(visitedData.contacts || []);
        } else {
          console.error("No user found with displayName:", username);
          setMessage("User not found.");
        }
      } catch (error) {
        console.error("Error fetching visited user:", error);
        setMessage("Error fetching user data.");
      }
    };
    fetchVisitedUser();
  }, [username]);

  // --- 2. When viewedUserId is available, check if this is the current user's profile and fetch subscription/role info ---
  useEffect(() => {
    if (viewedUserId && user) {
      setIsCurrentUser(viewedUserId === user.uid);

      const checkSubscription = async () => {
        if (user && viewedUserId && viewedUserId !== user.uid) {
          const subscriptionRef = doc(db, `users/${user.uid}/subscriptions`, viewedUserId);
          const subSnap = await getDoc(subscriptionRef);
          setIsSubscribed(subSnap.exists());
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

      checkSubscription();
      checkUserRole();
    }
  }, [viewedUserId, user]);

  // --- 3. Redirect to current user's profile if no username is provided ---
  useEffect(() => {
    if (!username && user?.displayName) {
      navigate(`/profile/${user.displayName}`);
    }
  }, [user, username, navigate]);

  // --- 4. Do not render Profile UI until profileData is loaded ---
  if (!profileData) {
    return <div>Loading profile...</div>;
  }

  // --- 5. Profile Picture Change Handling (for current user) ---
  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  // --- 6. Save Profile Updates (for current user) ---
  const handleSave = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, profileData, { merge: true });
      if (profilePictureFile) {
        const profilePictureRef = ref(storage, `profile_pics/${user.uid}/${profilePictureFile.name}`);
        await uploadBytes(profilePictureRef, profilePictureFile);
        const profilePicUrl = await getDownloadURL(profilePictureRef);
        await setDoc(docRef, { profilePicUrl }, { merge: true });
        setProfileData(prev => ({ ...prev, profilePicUrl }));
      }
      setMessage('Profile updated successfully!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Try again later.');
    }
  };

  // --- 7. Subscription Handling ---
  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, viewedUserId));
        await deleteDoc(doc(db, `users/${viewedUserId}/subscribers`, user.uid));
        setIsSubscribed(false);
      } else {
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

  // --- 8. Report, Ban, and Unban Functions ---
  const handleReport = async () => {
    const reason = prompt('Enter a reason for the report:');
    if (!reason) return;
    const reportUser = httpsCallable(functions, 'reportUser');
    try {
      const result = await reportUser({ userId: viewedUserId, reason });
      alert(result.data.message);
    } catch (error) {
      console.error('Error reporting user:', error);
      alert('Failed to report the user.');
    }
  };

  const handleBanUser = async () => {
    const duration = prompt('Enter ban duration in days:');
    if (!duration) return;
    const reason = prompt('Enter a reason for the ban:');
    if (!reason) return;
    const banUser = httpsCallable(functions, 'banUser');
    try {
      const result = await banUser({ userId: viewedUserId, duration: parseInt(duration), reason });
      alert(result.data.message);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban the user.');
    }
  };

  const handleUnbanUser = async () => {
    const unbanUser = httpsCallable(functions, 'unbanUser');
    try {
      const result = await unbanUser({ userId: viewedUserId });
      alert(result.data.message);
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Failed to unban the user.');
    }
  };

  // --- 9. Render the Profile Page ---
  return (
    <div className={styles.profilePage}>
      {/* Profile Banner and Picture */}
      <div className={styles.profileBanner}>
        <div className={styles.profileImageWrapper}>
          <img
            src={profilePicturePreview || profileData.profilePicUrl || dummyPic}
            alt={`${profileData.displayName || 'User'}'s profile`}
            className={styles.profileImage}
          />
        </div>
        {isCurrentUser && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
              id="profilePicUpload"
            />
            <button className={styles.profileButton} onClick={() => document.getElementById('profilePicUpload').click()}>
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

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <h2>{profileData.displayName || 'User Profile'}</h2>
        {isCurrentUser ? (
          <button className="diaryButton" onClick={() => navigate('/profile/diary')}>
            View My Diary
          </button>
        ) : (
          <>
            {user ? (
              <button className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`} onClick={handleSubscribe}>
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            ) : (
              <p className="login-message">Please log in to subscribe.</p>
            )}
          </>
        )}
        {isAdminOrModerator && !isCurrentUser && (
          <button onClick={handleBanUser} className={styles.banButton}>
            Ban User
          </button>
        )}
      </div>

      {/* About & Contact Sections (always visible, side by side) */}
      <div className={styles.aboutContactContainer}>
        {/* About Section */}
        <div className={styles.aboutSection}>
          <h3>About</h3>
          {isCurrentUser && editingAbout ? (
            <div className={styles.editAboutContainer}>
              <label className={styles.fieldLabel} htmlFor="bioInput">Bio</label>
              <input
                id="bioInput"
                type="text"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Enter your bio"
                className={styles.textField}
              />
              <label className={styles.fieldLabel} htmlFor="interestsInput">Interests</label>
              <input
                id="interestsInput"
                type="text"
                value={newInterests}
                onChange={(e) => setNewInterests(e.target.value)}
                placeholder="Enter your interests (comma separated)"
                className={styles.textField}
              />
              <div className={styles.buttonRow}>
                <button
                  onClick={async () => {
                    const docRef = doc(db, 'users', user.uid);
                    await setDoc(docRef, { bio: newBio, interests: newInterests }, { merge: true });
                    setProfileData((prev) => ({ ...prev, bio: newBio, interests: newInterests }));
                    setEditingAbout(false);
                  }}
                  className={styles.saveButton}
                >
                  Save About
                </button>
                <button onClick={() => setEditingAbout(false)} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>{profileData.bio || "No bio available."}</p>
              <p>
                <strong>Interests:</strong> {profileData.interests || "None listed."}
              </p>
              {isCurrentUser && (
                <button
                  className={styles.editButton}
                  onClick={() => {
                    setNewBio(profileData.bio || "");
                    setNewInterests(profileData.interests || "");
                    setEditingAbout(true);
                  }}
                >
                  Edit About
                </button>
              )}
            </>
          )}
        </div>

        {/* Contact Section */}
        <div className={styles.contactSection}>
          <h3>Contact</h3>
          {isCurrentUser && editingContact ? (
            <div className={styles.editContactContainer}>
              {contacts.map((contact, index) => (
                <div key={index} className={styles.contactFieldRow}>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => {
                      const newContacts = [...contacts];
                      newContacts[index] = e.target.value;
                      setContacts(newContacts);
                    }}
                    placeholder="Enter contact info"
                    className={styles.textField}
                  />
                  <button
                    onClick={() => {
                      const newContacts = contacts.filter((_, i) => i !== index);
                      setContacts(newContacts);
                    }}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button onClick={() => setContacts([...contacts, ""])} className={styles.addFieldButton}>
                Add Field
              </button>
              <div className={styles.buttonRow}>
                <button
                  onClick={async () => {
                    const docRef = doc(db, 'users', user.uid);
                    await setDoc(docRef, { contacts: contacts }, { merge: true });
                    setProfileData((prev) => ({ ...prev, contacts }));
                    setEditingContact(false);
                  }}
                  className={styles.saveButton}
                >
                  Save Contact
                </button>
                <button onClick={() => setEditingContact(false)} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {profileData.contacts && profileData.contacts.length > 0 ? (
                <ul>
                  {profileData.contacts.map((contact, index) => (
                    <li key={index}>
                      {/^https?:\/\//.test(contact) ? (
                        <a href={contact} target="_blank" rel="noopener noreferrer">
                          {contact}
                        </a>
                      ) : (
                        contact
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No contact information available.</p>
              )}
              {isCurrentUser && (
                <button
                  className={styles.editButton}
                  onClick={() => {
                    setContacts(profileData.contacts || []);
                    setEditingContact(true);
                  }}
                >
                  Edit Contact
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className={styles.postsSection}>
        <h3>Posts</h3>
        <ProfilePosts username={profileData.displayName} />
      </div>

      {/* Services Module: Only display if visited user's role is "healer" */}
      {visitedUserDoc && visitedUserDoc.role === 'healer' && (
        <div className={styles.servicesModule}>
          <h3>Services</h3>
          <HealerServices />
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Profile;

import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase';
import { connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import {
  doc, getDoc, setDoc, Timestamp, deleteDoc,
  collection, query, where, getDocs
} from 'firebase/firestore';
import { ref } from 'firebase/storage';
import styles from '../../styles/profile.module.css';
import dummyPic from "../dummyPic.jpeg";
import ProfilePosts from './ProfilePosts';
import HealerServices from './healerServices';
import ReportButton from '../ReportButton/Report';
import { uploadFileToStorage, validateFile } from '../../Utils/fileUtils';

// Start functions emulator if needed.
if (process.env.REACT_APP_USE_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

const Profile = () => {
  const { user } = useContext(UserContext);
  const { username } = useParams(); // Visited user's displayName
  const navigate = useNavigate();

  // Manages whether the dropdown is open or closed
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Visited user's data & doc ID
  const [profileData, setProfileData] = useState(null);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [visitedUserDoc, setVisitedUserDoc] = useState(null);

  // UI flags & messages
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  const [message, setMessage] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Editing About
  const [editingAbout, setEditingAbout] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newInterests, setNewInterests] = useState('');

  // Editing Contact
  const [editingContact, setEditingContact] = useState(false);
  const [contacts, setContacts] = useState([]);



  // 1. Redirect if a UID is provided in the URL
  useEffect(() => {
    if (username && /^[A-Za-z0-9]{20,}$/.test(username)) {
      const fetchUserById = async () => {
        try {
          const userRef = doc(db, 'users', username);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const newDisplayName = userData.displayName;
            navigate(`/profile/${newDisplayName}`, { replace: true });
          }
        } catch (error) {
          console.error('Error fetching user by UID:', error);
        }
      };
      fetchUserById();
    }
  }, [username, navigate]);

  // 2. Fetch visited user's document based on displayName
  useEffect(() => {
    const fetchVisitedUser = async () => {
      if (!username) return;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
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

  // 3. Check if this is the current user's profile and get subscription/role info
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

  // 4. If no username is provided, redirect to the current user's profile
  useEffect(() => {
    if (!username && user?.displayName) {
      navigate(`/profile/${user.displayName}`);
    }
  }, [user, username, navigate]);

  // 5. Don’t render until profileData is loaded
  if (!profileData) {
    return <div>Loading profile...</div>;
  }

  // Profile Picture Handling
  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  // Updated handleSave that uses the /temp/{userId} pattern and calls changeProfilePic function
  const handleSave = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      // First, merge any other profile changes
      await setDoc(docRef, profileData, { merge: true });

      if (profilePictureFile) {
        const isValid = await validateFile(profilePictureFile, "image");
        if (!isValid) {
          alert("Invalid profile picture file.");
          return;
        }
        // Upload the new file to the temporary folder.
        const tempFolder = `temp/${user.uid}`;
        // Note: uploadFileToStorage from your client utils returns the download URL,
        // but here we need the storage path. Since you know the file name, we can build it.
        await uploadFileToStorage(profilePictureFile, tempFolder);
        const tempFilePath = `${tempFolder}/${profilePictureFile.name}`;

        // Call the Cloud Function to change the profile picture.
        const changeProfilePic = httpsCallable(functions, 'changeProfilePic');
        const result = await changeProfilePic({ filePath: tempFilePath });
        const profilePicUrl = result.data.profilePicUrl;

        // Update the user's document with the new profilePicUrl.
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

  // 7. Subscription Handling
  const handleSubscribe = async () => {
    try {
      if (isSubscribed) {
        // Unsubscribe
        await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, viewedUserId));
        await deleteDoc(doc(db, `users/${viewedUserId}/subscribers`, user.uid));
        setIsSubscribed(false);
      } else {
        // Subscribe
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

  // 8. Ban/Unban functions for moderators/admins
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

  // 9. Render the Profile Page
  return (
    <div className={styles.profilePage}>
      {/* Profile Banner and Picture */}
      <div className={styles.profileBanner}>
        {isCurrentUser && (
          <div className={styles.dropdownContainer}>
            <button
              className={styles.dropdownButton}
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              ⋮
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    document.getElementById('profilePicUpload').click();
                    setDropdownOpen(false);
                  }}
                >
                  Change Profile Picture
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.profileImageWrapper}>
          <img
            src={profilePicturePreview || profileData.profilePicUrl || dummyPic}
            alt={`${profileData.displayName || 'User'}'s profile`}
            className={styles.profileImage}
          />
        </div>

        {/* Show "Save Changes" if a new file has been chosen */}
        {isCurrentUser && profilePictureFile && (
          <button className={styles.profileButton} onClick={handleSave}>
            Save Changes
          </button>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
          style={{ display: 'none' }}
          id="profilePicUpload"
        />
      </div>

      {/* Profile Header: Centered profile name; Report button absolutely positioned on the right */}
      <div className={styles.profileHeader}>
        <h2>{profileData.displayName || 'User Profile'}</h2>

        {/* If it's the current user, show diary button; otherwise, show subscribe/unsubscribe */}
        {isCurrentUser ? (
          <button className={styles.diaryButton} onClick={() => navigate('/profile/diary')}>
            View My Diary
          </button>
        ) : (
          <>
            {user ? (
              <button
                className={
                  isSubscribed
                    ? `${styles.subscribeButton} ${styles.subscribed}`
                    : styles.subscribeButton
                }
                onClick={handleSubscribe}
              >
                {isSubscribed ? 'Unfollow' : 'Follow'}
              </button>
            ) : (
              <p className="login-message">Please log in to follow.</p>
            )}
          </>
        )}

        {isAdminOrModerator && !isCurrentUser && (
          <button onClick={handleBanUser} className={styles.banButton}>
            Ban User
          </button>
        )}

        {/* Absolutely positioned Report button on the right */}
        {!isCurrentUser && (
          <div className={styles.profileReport}>
            <ReportButton
              contentUrl={window.location.href}
              profileUrl={window.location.href}
              iconOnly={true}
            />
          </div>
        )}
      </div>

      {/* About & Contact Sections */}
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
                <ul className={styles.contactList}>
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

      {/* Services Module (for healers) */}
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

import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase';
import { httpsCallable } from 'firebase/functions';
import {
  doc, getDoc, setDoc, Timestamp, deleteDoc,
  collection, query, where, getDocs
} from 'firebase/firestore';
import { ref } from 'firebase/storage';
import styles from '../../styles/profile.module.css';
import dummyPic from "../dummyPic.jpeg";
import ProfilePosts from './ProfilePosts';
import HealerServices from './healerServices'; // New module for healers
import Donate from '../Stripe/Donate';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import StripeSignup from '../Stripe/StripeSignup';
import StripeAccount from '../Stripe/StripeAccount';
import ReportButton from '../ReportButton/Report';
import { uploadFileToStorage, validateFile } from '../../Utils/fileUtils';


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

  const handleSave = async () => {
    try {
      console.log("=== Starting handleSave function ===");
      console.log("User ID:", user.uid);

      // Skip updating the profile data for now and focus only on the profile picture
      // The Firestore permissions error is happening at this step:
      // const docRef = doc(db, 'users', user.uid);
      // await setDoc(docRef, profileData, { merge: true });

      if (profilePictureFile) {
        setMessage('Uploading profile picture...');
        console.log("Starting profile picture upload process");
        console.log("Profile picture file:", profilePictureFile.name, profilePictureFile.type);

        // Make sure the filename is clean (no spaces or special characters)
        const safeFileName = profilePictureFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
        console.log("Safe file name:", safeFileName);

        // Create new file with clean name if needed
        let fileToUpload = profilePictureFile;
        if (safeFileName !== profilePictureFile.name) {
          console.log("Creating new file with safe name");
          fileToUpload = new File([profilePictureFile], safeFileName, { type: profilePictureFile.type });
        }

        // Validate file
        console.log("Validating file...");
        const isValid = await validateFile(fileToUpload, "image");
        if (!isValid) {
          setMessage("Invalid profile picture file.");
          return;
        }

        // Upload to Firebase Storage
        const tempFolder = `temp/${user.uid}`;
        console.log(`Uploading to temp folder: ${tempFolder}`);

        try {
          const storagePath = await uploadFileToStorage(fileToUpload, tempFolder);
          console.log("File uploaded to storage path:", storagePath);

          // Call the Cloud Function
          console.log("Calling changeProfilePic cloud function with path:", storagePath);
          const changeProfilePic = httpsCallable(functions, 'changeProfilePic');
          const result = await changeProfilePic({ filePath: storagePath });
          console.log("Cloud function result:", result.data);

          // Update state with the new URL
          const profilePicUrl = result.data.profilePicUrl;
          console.log("New profile pic URL:", profilePicUrl);

          setProfileData(prev => ({ ...prev, profilePicUrl }));
          setProfilePicturePreview(profilePicUrl);
          setProfilePictureFile(null);
          setMessage('Profile picture updated successfully!');
        } catch (error) {
          console.error("Error in profile picture upload or processing:", error);
          setMessage(`Profile picture error: ${error.message || error.toString()}`);
        }
      } else {
        setMessage('No profile picture selected to update.');
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      setMessage(`Error: ${error.message || error.toString()}`);
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
          userId: user.uid,
          timestamp: Timestamp.now(),
        });
        await setDoc(doc(db, `users/${viewedUserId}/subscribers`, user.uid), {
          userId: user.uid,
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

      {/* About, Contact Sections and Donate section */}
      <div className={styles.aboutContactContainer}>

        {/* Only show Donate if not viewing own profile */}
        {/*only render if user has associated Stripe id in firestore (todo)*/}

        {/* Only show Donate if not viewing own profile */}
        {/*only render if user has associated Stripe id in firestore (todo)*/}
        {user && (!isCurrentUser ? (
          <div className={styles.donateContainer}>
            <h3>Donate</h3>
            <Donate recipientId={viewedUserId} />
          </div>
        ) : (
          <div className={styles.donateContainer}>
            <h3>Stripe Integration</h3>
            {user.stripeOnboarded ? (
              <StripeAccount />
            ) : (
              <StripeSignup />
            )}
          </div>
        ))}
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

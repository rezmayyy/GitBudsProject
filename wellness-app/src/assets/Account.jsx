import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import UserContext from '../UserContext';
import { db, storage, functions } from '../Firebase'; // Import Firebase functions
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '../styles/Profile.css';
import dummyPic from "./dummyPic.jpeg";

import { connectFunctionsEmulator } from 'firebase/functions';

// Connect to emulator (only use this for local development)
connectFunctionsEmulator(functions, "localhost", 5001);

function Account() {
    const { user } = useContext(UserContext);
    const { userId } = useParams();
    const [profileData, setProfileData] = useState({
        displayName: '',
        profilePictureUrl: '',
        email: '',
        password: ''
    });
    const [editMode, setEditMode] = useState(false);
    const [tempProfileData, setTempProfileData] = useState(accountData);
    const [displayName, setDisplayName] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState('');
    const [email, setEmail, oldEmail] = useState('');
    const [password, setPassword, oldPassword, passwordConfirmed] = useState('');

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

        fetchProfile();
    }, [userId, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTempProfileData({ ...tempProfileData, [name]: value });
    };

    const handleDisplayNameChange = (e) => {
        setDisplayName(e.target.value);
    };

    const handleProfilePictureChange = (e) => {
        if (e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
        }
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const checkEmail = (e) => {
        const { typed } = e.target.value;
        if (typed != profileData.email) {
            setMessage('Current email is incorrect.');
            // TODO: Grey out & disable submit button.
            return;
        }
    }

    const checkNewEmail = (e) => {
        const { typed } = e.target.value;
        if (typed == profileData.email) {
            setMessage('New email is the same as old email.');
            // TODO: Grey out & disable submit button.
            return;
        }
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const checkPassword = (e) => {
        const { typed } = e.target.value;
        if (typed != profileData.password) {
            setMessage('Current password is incorrect.');
            // TODO: Grey out & disable submit button.
            return;
        }
    }

    const checkNewPassword = (e) => {
        const { typed } = e.target.value;
        if (typed == profileData.password) {
            setMessage('New password is the same as old password.');
            // TODO: Grey out & disable submit button.
            return;
        }
    }

    const confirmNewPassword = (e) => {
        const { typed } = e.target.value;
        if (typed != password) {
            setMessage('New passwords do not match.');
            // TODO: Grey out & disable submit button.
            return;
        }
    }

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

    const handleApplication = () => {
        // TODO
    }

    const handleDeletion = () => {
        // TODO
    }

    const [activeTab, setActiveTab] = useState('changeDisplayName'); // default tab

    const renderTabContent = () => {
        // switch between account settings
        switch (activeTab) {
            case 'changeDisplayName':
                return (
                    <div className="name-tag">
                        <h3>Change Display Name</h3>
                        <form className="name-form" onSubmit={handleDisplayNameChange}>
                            <p>Please enter a new display name.</p>
                            <input
                                type="text"
                                placeholder="New Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                            <FaUser className="icon" />
                            <button className={styles.profileButton} type="submit">Change Profile Picture</button>
                        </form>
                    </div>
                )
            case 'changeProfilePicture':
                return (
                    <div className="picture-tab">
                        <h3>Change Profile Picture</h3>
                        <form className="picture-form" onSubmit={handleProfilePictureChange}>
                            <p>Please upload a profile picture.</p>
                            <input
                                type="file"
                                placeholder="Upload File"
                                value={profilePictureFile}
                                onChange={(e) => setProfilePictureFile(e.target.value)}
                                required
                            />
                            <button className={styles.profileButton} type="submit">Change Profile Picture</button>
                        </form>
                    </div>
                );
            case 'changeEmailAddress':
                return (
                    <div className="email-tab">
                        <h3>Change Email Address</h3>
                        <form className="email-form" onSubmit={handleEmailChange}>
                            <input
                                type="email"
                                placeholder="Current Email"
                                value={oldEmail}
                                onChange={(e) => checkEmail(e.target.value)}
                                required
                            />
                            <FaEnvelope className="icon" />
                            <input
                                type="email"
                                placeholder="New Email"
                                value={email}
                                onChange={(e) => checkNewEmail(e.target.value)}
                                required
                            />
                            <FaEnvelope className="icon" />
                        </form>
                    </div>
                )
            case 'changePassword':
                return (
                    <div className="pw-tab">
                        <h3>Change Password</h3>
                        <form className="pw-form" onSubmit={handlePasswordChange}>
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={oldPassword}
                                onChange={(e) => checkPassword(e.target.value)}
                                required
                            />
                            <FaLock className="icon" />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => checkNewPassword(e.target.value)}
                                required
                            />
                            <FaLock className="icon" />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordConfirmed}
                                onChange={(e) => confirmNewPassword(e.target.value)}
                                required
                            />
                            <FaLock className="icon" />
                            <button className={styles.profileButton} type="submit">Change Password</button>
                        </form>
                    </div>
                );
            case 'applyToBeAHealer':
                return (
                    <div className="apply-tab">
                        <h3>Apply To Be A Healer</h3>
                        <form className="apply-form" onSubmit={handleApplication}>
                            <p>Coming soon!</p> // TODO: Ask Dr. Gigi for specifics
                        </form>
                    </div>
                );
            case 'deleteAccount':
                return (
                    <div className="delete-tab">
                        <h3>Delete Your Account</h3>
                        <form className="deletion-form" onSubmit={handleDeletion}>
                            <p>Are you sure you want to delete your account? This action is irreversable.</p>
                            <input
                                type="text"
                                placeholder="Why are you deleting your account? (optional)"
                                value={reason}
                            />
                            <p>We want to make sure that it's really you. Please confirm your password.</p>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => checkPassword(e.target.value)}
                                required
                            />
                            <FaLock className="icon" />
                            <button className={styles.profile - button} type="submit">Delete Account</button>
                        </form>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.accountPage}>
            <div className={styles.accountBanner}>
                <div className={styles.profileImageWrapper}>
                    <img
                        src={profileImage || dummyPic} // Use dummyPic as the default profile picture
                        alt={`${username}'s profile`}
                        className={styles.profileImage}
                    />
                </div>
            </div>
            <div className="tabs">
                // if user clicks on Change Display Name, show display name form
                <button
                    onClick={() => setActiveTab('changeDisplayName')
                    } className={`tab-button ${activeTab === 'changeDisplayName' ? 'active' : 'changeDisplayName'}`}>
                    Change Display Name
                </button>

                // if user clicks on Change Profile Picture, show profile picture form
                <button
                    onClick={() => setActiveTab('changeProfilePicture')
                    } className={`tab-button ${activeTab === 'changeProfilePicture' ? 'active' : 'changeProfilePicture'}`}>
                    Change Profile Picture
                </button>

                // if user clicks on Change Email Address, show email address form
                <button onClick={() =>
                    setActiveTab('changeEmailAddress')
                } className={`tab-button ${activeTab === 'changeEmailAddress' ? 'active' : 'changeEmailAddress'}`}>
                    Change Email Address
                </button>

                // if user clicks on Change Password, show password form
                <button onClick={() =>
                    setActiveTab('changePassword')
                } className={`tab-button ${activeTab === 'changePassword' ? 'active' : 'changePassword'}`}>
                    Change Password
                </button>

                // if user clicks on Apply To Be A Healer, show application form
                <button onClick={() =>
                    setActiveTab('applyToBeAHealer')
                } className={`tab-button ${activeTab === 'applyToBeAHealer' ? 'active' : 'applyToBeAHealer'}`}>
                    Apply To Be A Healer
                </button>

                // if user clicks on Delete Account, show account deletion form
                <button onClick={() =>
                    setActiveTab('deleteAccount')
                } className={`tab-button ${activeTab === 'deleteAccount' ? 'active' : 'deleteAccount'}`}>
                    Delete Account
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>

            {message && <p className="message">{message}</p>};
        </div>
    )
}

export default Account;
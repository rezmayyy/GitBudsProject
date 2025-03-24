/* eslint-disable no-unused-vars */
import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UserContext from './UserContext';
import { db, storage, functions} from './Firebase'; // Import Firebase functions
import { doc, getDoc, setDoc, Timestamp, deleteDoc} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from '../styles/account.css';
import dummyPic from "./dummyPic.jpeg";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import HealerApplicationForm from './ApplyForHealer/HealerApplicationForm';
import YourFollows from './YourFollows';



function Account() {
    const { user } = useContext(UserContext);
    const { userId } = useParams();
    const [profileData, setProfileData] = useState({
        displayName: '',
        profilePictureUrl: '',
        email: '',
    });
    const [editMode, setEditMode] = useState(false);
    const [reason, setReason] = useState('');
    const [tempProfileData, setTempProfileData] = useState(profileData);
    const [displayName, setDisplayName] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('changeDisplayName'); // default tab
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    useEffect(() => {
        setMessage('');
    }, [activeTab]);

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
        if (typed !== profileData.email) {
            setMessage('Current email is incorrect.');
            return;
        }
    };

    const checkNewEmail = (e) => {
        const { typed } = e.target.value;
        if (typed === profileData.email) {
            setMessage('New email is the same as old email.');
            return;
        }
    };

    // Check password validation
    const checkPassword = () => {
        if (currentPassword !== profileData.password) {
            setMessage('Current password is incorrect.');
            return;
        }
    };

    const checkNewPassword = () => {
        if (newPassword === profileData.password) {
            setMessage('New password is the same as old password.');
            return;
        }
    };

    const confirmNewPassword = () => {
        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match.');
            return;
        }
        else{
            setMessage('passwords match');
        }
    };

    const handleSave = async () => {
        try {
            const docRef = doc(db, 'users', user.uid);
            await setDoc(docRef, tempProfileData, { merge: true });

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

    // const handleApplication = () => {
    //     // TODO
    // };

        const handleDeletion = async (e) => {
        e.preventDefault();
        setShowDeleteConfirm(true);
    };

    const confirmDeletion = async () => {
        try {
            const docRef = doc(db, 'users', user.uid);
            await deleteDoc(docRef);
            // Add any additional cleanup like signing out the user
            setMessage('Account deleted successfully');
            // You might want to redirect the user or sign them out here
        } catch (error) {
            console.error('Error deleting account:', error);
            setMessage('Failed to delete account. Please try again later.');
        }
        setShowDeleteConfirm(false);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        const auth = getAuth();
        const userCredential = auth.currentUser;
        const credentials = EmailAuthProvider.credential(userCredential.email, currentPassword);

        try {
            // Reauthenticate the user before changing password
            await reauthenticateWithCredential(userCredential, credentials);
            await updatePassword(userCredential, newPassword);
            setMessage('Password updated successfully!');
        } catch (error) {
            setMessage('Failed to update password. Please check your current password.');
        }
    };

    

    const renderTabContent = () => {
        switch (activeTab) {
            case 'changeDisplayName':
                return (
                    <div className="form-box">
                        <h3>Change Display Name</h3>
                        <form onSubmit={handleDisplayNameChange}>
                            <p>Please enter a new display name.</p>
                            <div className='input-box'>
                                <input
                                    type="text"
                                    placeholder="New Display Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit">Change Display Name</button>
                        </form>
                    </div>
                );
            case 'changeProfilePicture':
                return (
                    <div className="form-box">
                        <h3>Change Profile Picture</h3>
                        <form onSubmit={handleProfilePictureChange}>
                            <p>Please upload a profile picture.</p>
                            <div className='input-box'>
                                <input
                                    type="file"
                                    placeholder="Upload File"
                                    value={profilePictureFile}
                                    onChange={(e) => setProfilePictureFile(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit">Change Profile Picture</button>
                        </form>
                    </div>
                );
            case 'changeEmailAddress':
                return (
                    <div className="form-box">
                        <h3>Change Email Address</h3>
                            <form onSubmit={handleEmailChange}>
                                <p>Please type your current and new email addresses.</p>
                                <div className='input-box'>
                                    <input
                                        type="email"
                                        placeholder="Current Email"
                                        value={email}
                                        onChange={(e) => checkEmail(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="New Email"
                                        value={email}
                                        onChange={(e) => checkNewEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit">Change Email Address</button>
                            </form>
                        </div>
                );
            case 'changePassword':
                return (
                    <div className="form-box">
                        <h3>Change Password</h3>
                        <form className="pw-form" onSubmit={handlePasswordChange}>
                            <div className='input-box'>
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        checkPassword();
                                    }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        checkNewPassword();
                                    }}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        confirmNewPassword();
                                    }}
                                    required
                                />
                            </div>
                            <button type="submit">Change Password</button>
                        </form>
                    </div>
                );
            case 'applyToBeAHealer':
                return (
                    <div className="form-box">
                        <HealerApplicationForm />
                    </div>
                );
            case 'deleteAccount':
                return (
                    <div className="form-box">
                        <h3>Delete Account</h3>
                        <form className="delete-form" onSubmit={handleDeletion}>
                            <p>Warning: This action cannot be undone.</p>
                            <button className={styles.profileButton} type="submit">Delete Account</button>
                        </form>
                        
                        {showDeleteConfirm && (
                            <div className={styles.popup}>
                                <div className={styles.popupContent}>
                                    <h4>Are you sure you want to delete your account?</h4>
                                    <p>This action cannot be undone.</p>
                                    <div className={styles.popupButtons}>
                                        <button onClick={confirmDeletion} className={styles.deleteButton}>
                                            Yes, Delete Account
                                        </button>
                                        <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelButton}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'yourFollows':
                return (
                     <div className="form-box">
                         <h3>Your Follows</h3>
                            <p>These are the users you are currently following.</p>
                            <YourFollows />
                    </div>
                 );
            default:
                return null;
        }
    };

    return (
        <div className="wrapper">
            <div className="tabs">
                <button onClick={() => setActiveTab('changeDisplayName')} className={`tab-button ${activeTab === 'changeDisplayName' ? 'active' : ''}`}>
                    Change Display Name
                </button>
                <button onClick={() => setActiveTab('changeProfilePicture')} className={`tab-button ${activeTab === 'changeProfilePicture' ? 'active' : ''}`}>
                    Change Profile Picture
                </button>
                <button onClick={() => setActiveTab('changeEmailAddress')} className={`tab-button ${activeTab === 'changeEmailAddress' ? 'active' : ''}`}>
                    Change Email Address
                </button>
                <button onClick={() => setActiveTab('changePassword')} className={`tab-button ${activeTab === 'changePassword' ? 'active' : ''}`}>
                    Change Password
                </button>
                <button onClick={() => setActiveTab('applyToBeAHealer')} className={`tab-button ${activeTab === 'applyToBeAHealer' ? 'active' : ''}`}>
                    Apply to Be a Healer
                </button>
                <button onClick={() => setActiveTab('deleteAccount')} className={`tab-button ${activeTab === 'deleteAccount' ? 'active' : ''}`}>
                    Delete Account
                </button>
                <button onClick={() => setActiveTab('yourFollows')} className={`tab-button ${activeTab === 'yourFollows' ? 'active' : ''}`}> 
                    Your Follows
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>

            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default Account;

import { Link, useNavigate } from 'react-router-dom';
import React, { useContext, useState } from 'react';
import '../styles/header.css';
import logo from '../assets/Logo.png';
import UserContext from './UserContext';
import Signout from './Signout';
import { auth, db } from './Firebase'; // Adjust the import path as necessary
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore methods

function Header() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    // Profile login check
    const handleProfileClick = (event) => {
        if (!user) {
            event.preventDefault(); // Prevent default navigation
            navigate('/login'); // Redirect to login page
        }
    };

    // Function to create or update the user document
    const handleUserDocument = async () => {
        if (user) {
            const userRef = doc(db, 'users', user.uid); // Reference to the user document
            const userData = {
                email: user.email,
                displayName: user.displayName,
                role: 'admin', // Set role as admin
                status: 'active', // Set status as active
            };

            try {
                // Create or update the user document
                await setDoc(userRef, userData, { merge: true });
                console.log('User document created/updated successfully!');
            } catch (error) {
                console.error('Error creating/updating user document:', error);
            }
        }
    };

    // Function to set user role
    const setUserRole = async (role) => {
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid); // Reference to the user document
                await setDoc(userRef, { role }, { merge: true }); // Update the user role
                console.log(`User role updated to ${role}`);
            } catch (error) {
                console.error("Error updating user role: ", error);
            }
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <header>
            {/* Div for Logo and "TribeWell" */}
            <div className="brand-container">
                <Link to="/"><img src={logo} alt="TribeWell Logo" className="logo" /></Link>                
                <h1>TribeWell</h1>
            </div>
            <nav>
                {/* Div for Search bar and navlinks */}
                <div className="nav-center">
                <input
                    type="text"
                    placeholder="Search..."
                    className="search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                    <ul className="nav-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/explore">Explore</Link></li>
                        <li><Link to="/learn">Learn</Link></li>
                        <li><Link to="/blogs">Blogs</Link></li>
                        <li><Link to="/profile" onClick={handleProfileClick}>Profile</Link></li>
                        <li><Link to="/discussion">Discussion Board</Link></li>
                        <li><Link to="/create-post">Create</Link></li>
                    </ul>
                </div>
                <ul className="auth-links">
                    <>
                        {user ? (
                            <>
                                <li>{user && <p>Signed in as: {user.displayName}</p>}</li>
                                <li><Signout /></li>
                                <li><Link to="/account">Account</Link></li>
                                {/* Add button to create/update user document */}
                                <li>
                                    <button onClick={handleUserDocument}>Create/Update User Document</button>
                                </li>
                                <li>
                                    <button onClick={() => setUserRole('admin')}>Set as Admin</button>{/*changing firebase rules to allow button to always work, will need to revert this*/}
                                    <button onClick={() => setUserRole('normal')}>Set as Normal</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login">Log In</Link></li>
                                <li><Link to="/signup">Sign Up</Link></li>
                            </>
                        )}
                    </>
                </ul>
            </nav>
        </header>
    );
}

export default Header;

import { Link, useNavigate } from 'react-router-dom';
import React, { useContext, useState, useEffect, useRef } from 'react';
import '../styles/header.css';
import logo from './Logo.png';
import UserContext from './UserContext';
import Signout from './Auth/Signout';
import { db } from './Firebase';
import { doc, setDoc } from 'firebase/firestore';
import dummyPic from './dummyPic.jpeg';

function Header() {
    const { user } = useContext(UserContext); // Get the user object from context
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState(''); // Search bar state
    const [menuOpen, setMenuOpen] = useState(false); // State to control hamburger menu visibility
    const menuRef = useRef(null); // Reference for the dropdown menu
    const hamburgerRef = useRef(null); // Reference for the hamburger button
    const [profilePic, setProfilePic] = useState(dummyPic); // State for the profile picture

    // Update profile picture dynamically based on user data
    useEffect(() => {
        if (user?.profilePicUrl) {
            const img = new Image();
            img.src = user.profilePicUrl;

            img.onload = () => setProfilePic(user.profilePicUrl); // Set user's profile picture on success
            img.onerror = () => setProfilePic(dummyPic); // Fallback to dummy picture on error
        }
    }, [user?.profilePicUrl]);

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev); // Toggle the hamburger menu open state
    };

    const closeMenu = () => {
        setMenuOpen(false); // Close the menu
    };

    const handleProfileClick = (event) => {
        // If the user is not logged in, redirect them to the login page
        if (!user) {
            event.preventDefault();
            navigate('/login');
        }
    };

    // Close menu when user logs out
    useEffect(() => {
        if (!user) {
            closeMenu();
        }
    }, [user]);

    const handleUserDocument = async () => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            const userData = {
                email: user.email,
                displayName: user.displayName,
            };

            try {
                await setDoc(userRef, userData, { merge: true });
                console.log('User document created/updated successfully!');
            } catch (error) {
                console.error('Error creating/updating user document:', error);
            }
        }
    };

    const setUserRole = async (role) => {
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, { role }, { merge: true });
                console.log(`User role updated to ${role}`);
            } catch (error) {
                console.error("Error updating user role:", error);
            }
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
        }
    };

    // Close the menu if the user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(event.target)
            ) {
                closeMenu();
            }
        };

        document.addEventListener('mouseup', handleClickOutside);

        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
        };
    }, [menuOpen]);

    return (
        <header>
            <div className="brand-container">
                <Link to="/">
                    <img src={logo} alt="TribeWell Logo" className="logo" />
                </Link>
                <Link style={{textDecoration: 'none'}} to="/">
                    <h1 style={{align: 'center', color: 'white'}}>TribeWell</h1>
                </Link>
            </div>
            <nav>
                <div className="nav-center">
                    {/* Search bar */}
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-bar"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    {/* Navigation links */}
                    <ul className="nav-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/explore">Explore</Link></li>
                        <li><Link to="/learn">Learn</Link></li>
                        <li><Link to="/blogs">Blogs</Link></li>
                        <li><Link to="/profile" onClick={handleProfileClick}>Profile</Link></li>
                        <li><Link to="/discussion">Discussion Board</Link></li>
                        <li><Link to="/create-post">Create</Link></li>
                        <li><Link to="/account">Account</Link></li>
                    </ul>
                </div>
                <div className="auth-buttons">
                    {/* Conditional rendering based on user authentication */}
                    {!user ? (
                        // If no user is logged in, show Log In and Sign Up buttons
                        <>
                            <Link to="/login" className="auth-button">Log In</Link>
                            <Link to="/signup" className="auth-button">Sign Up</Link>
                        </>
                    ) : (

                        // If a user is logged in, show the Signout component
                        <Signout Link to="/" className="auth-button">Sign out</Signout>
                    

                    )}
                </div>
                <div className="hamburger-container">
                    {/* Conditional rendering for hamburger button */}
                    <button ref={hamburgerRef} onClick={toggleMenu} className="hamburger-button">
                        {user ? <img src={profilePic} alt="Profile" /> : '☰'}
                        {/* If user is logged in, show their profile picture; otherwise, show a menu icon */}
                    </button>
                    <div ref={menuRef} className={`menu-content ${menuOpen ? 'active' : ''}`}>
                        <ul className="hamburger-nav-links">
                            {/* Same navigation links as in the main nav */}
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/explore">Explore</Link></li>
                            <li><Link to="/learn">Learn</Link></li>
                            <li><Link to="/blogs">Blogs</Link></li>
                            <li><Link to="/profile" onClick={handleProfileClick}>Profile</Link></li>
                            <li><Link to="/discussion">Discussion Board</Link></li>
                            <li><Link to="/create-post">Create</Link></li>
                          
                        </ul>
                        <div className="hamburger-auth-buttons">
                            {/* Conditional rendering for authentication actions */}
                            {user ? (
                                // If a user is logged in, show account management and signout options
                                <>
                                    <Link to="/account" className="menu-link" onClick={closeMenu}>{user.displayName}</Link>
                                    <Signout className="menu-link" closeMenu={closeMenu} />
                                    <button className="menu-link" onClick={() => { handleUserDocument(); closeMenu(); }}>Create/Update User Document</button>
                                    <button className="menu-link" onClick={() => { setUserRole('admin'); closeMenu(); }}>Set as Admin</button>
                                    <button className="menu-link" onClick={() => { setUserRole('normal'); closeMenu(); }}>Set as Normal</button>
                                </>
                            ) : (
                                // If no user is logged in, show Log In and Sign Up links
                                <>
                                    <Link to="/login" className="menu-link" onClick={closeMenu}>Log In</Link>
                                    <Link to="/signup" className="menu-link" onClick={closeMenu}>Sign Up</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;

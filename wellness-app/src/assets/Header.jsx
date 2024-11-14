import { Link, useNavigate } from 'react-router-dom';
import React, { useContext, useState, useEffect, useRef } from 'react';
import '../styles/header.css';
import logo from '../assets/Logo.png';
import UserContext from './UserContext';
import Signout from './Signout';
import { db } from './Firebase';
import { doc, setDoc } from 'firebase/firestore';
import dummyPic from './dummyPic.jpeg';

function Header() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null); // Create a ref for the menu
    const hamburgerRef = useRef(null); // Create a ref for the hamburger button
    const [profilePic, setProfilePic] = useState(dummyPic); // Initialize with dummyPic

    // Check and set profile picture
    useEffect(() => {
        if (user?.profilePicUrl) {
            const img = new Image();
            img.src = user.profilePicUrl;

            // On successful load, set profile picture to user's URL
            img.onload = () => setProfilePic(user.profilePicUrl);
            // On error, fall back to dummyPic
            img.onerror = () => setProfilePic(dummyPic);
        }
    }, [user?.profilePicUrl]);

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev); // Toggle the menu open state
    };

    const closeMenu = () => {
        setMenuOpen(false); // Close the menu
    };

    const handleProfileClick = (event) => {
        if (!user) {
            event.preventDefault();
            navigate('/login');
        }
    };

    useEffect(() => {
        // Close the menu when the user logs out
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
                role: 'admin',
                status: 'active',
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

    // Handle click outside the menu
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
                <h1>TribeWell</h1>
            </div>
            <nav>
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
                <div className="auth-buttons">
                    {!user ? (
                        <>
                            <Link to="/login" className="auth-button">Log In</Link>
                            <Link to="/signup" className="auth-button">Sign Up</Link>
                        </>
                    ) : (
                        <Signout />
                    )}
                </div>
                <div className="hamburger-container">
                    <button ref={hamburgerRef} onClick={toggleMenu} className="hamburger-button">
                        {user ? <img src={profilePic} alt="Profile" /> : '☰'}
                    </button>
                    <div ref={menuRef} className={`menu-content ${menuOpen ? 'active' : ''}`}>
                        <ul className="hamburger-nav-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/explore">Explore</Link></li>
                            <li><Link to="/learn">Learn</Link></li>
                            <li><Link to="/blogs">Blogs</Link></li>
                            <li><Link to="/profile" onClick={handleProfileClick}>Profile</Link></li>
                            <li><Link to="/discussion">Discussion Board</Link></li>
                            <li><Link to="/create-post">Create</Link></li>
                        </ul>
                        <div className="hamburger-auth-buttons">
                            {user ? (
                                <>
                                    <Link to="/account" className="menu-link" onClick={closeMenu}>{user.displayName}</Link>
                                    <Signout className="menu-link" closeMenu={closeMenu} />
                                    <button className="menu-link" onClick={() => { handleUserDocument(); closeMenu(); }}>Create/Update User Document</button>
                                    <button className="menu-link" onClick={() => { setUserRole('admin'); closeMenu(); }}>Set as Admin</button>
                                    <button className="menu-link" onClick={() => { setUserRole('normal'); closeMenu(); }}>Set as Normal</button>
                                </>
                            ) : (
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

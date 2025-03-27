import { Link, NavLink, useNavigate } from "react-router-dom";
import React, { useContext, useState, useEffect, useRef } from "react";
import "../styles/header.css"; // General styles
import styles from "../styles/HamburgerMenu.module.css"; // Hamburger Menu styles
import logo from "./TribeWellLogo.png";
import UserContext from "./UserContext";
import Signout from "./Auth/Signout";
import { db } from "./Firebase";
import { doc, setDoc } from "firebase/firestore";
import dummyPic from "./dummyPic.jpeg";

function Header() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const [profilePic, setProfilePic] = useState(dummyPic);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize and set mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        closeMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.profilePicUrl) {
      const img = new Image();
      img.src = user.profilePicUrl;
      img.onload = () => setProfilePic(user.profilePicUrl);
      img.onerror = () => setProfilePic(dummyPic);
    }
  }, [user?.profilePicUrl]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleProfileClick = (event) => {
    if (!user) {
      event.preventDefault();
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!user) closeMenu();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleUserDocument = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userData = { email: user.email, displayName: user.displayName };
      try {
        await setDoc(userRef, userData, { merge: true });
        closeMenu();
      } catch (error) {
        console.error("Error creating/updating user document:", error);
      }
    }
  };

  const setUserRole = async (role) => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { role }, { merge: true });
        closeMenu();
      } catch (error) {
        console.error("Error updating user role:", error);
      }
    }
  };

  return (
    <header>
      <div className="header-container">
        {/* Left - Logo and Title */}
        <div className="brand-container">
          <Link to="/" className="logo-link">
            <img src={logo} alt="TribeWell Logo" className="logo" />
          </Link>
          <Link to="/" className="brand-title">
            <h1 className="site-title">TribeWell</h1>
          </Link>
        </div>

        {/* Center - Desktop navigation and search */}
        <div className="center-section">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search..."
              className="search-bar rounded-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          {/* Nav Links */}
          <nav className="main-nav">
            <ul className="nav-links">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/directory"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Directory
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/blogs"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Blogs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                  onClick={handleProfileClick}
                >
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/discussion"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Discussion Board
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/create-post"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Create
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) => (isActive ? 'active-tab' : '')}
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Right - Auth Buttons or Profile */}
        <div className="right-section">
          {/* Auth Buttons (when not logged in) */}
          {!user && (
            <div className="auth-buttons">
              <Link to="/login" className="auth-button">Log In</Link>
              <Link to="/signup" className="auth-button">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Toggle (for mobile view) */}
          {isMobile && (
            <button
              ref={triggerRef}
              onClick={toggleMenu}
              className={`${styles.hamburgerButton} ${user ? 'hide-button' : ''}`}
              aria-label="Menu"
            >
              ☰
            </button>
          )}

          {/* Profile Picture (when logged in) */}
          {user && (
            <div className="profile-container" onClick={toggleMenu} ref={triggerRef}>
              <img src={profilePic} alt="Profile" className="profile-pic" />
            </div>
          )}
        </div>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}

      {/* Sidebar Menu */}
      <div
        ref={menuRef}
        className={`${styles.menuContent} ${menuOpen ? styles.active : ""}`}
        style={{ right: menuOpen ? '0' : '-300px' }}
      >
        <button className={styles.closeButton} onClick={closeMenu} aria-label="Close menu">✖</button>

        {user && (
          <div className={styles.userInfo}>
            <img src={profilePic} alt="Profile" className={styles.sidebarProfilePic} />
            <p className={styles.username}>{user.displayName || 'User'}</p>
          </div>
        )}

        {/* Conditionally render nav links only on mobile */}
        {isMobile && (
          <ul className={styles.hamburgerNavLinks}>
            <li><Link to="/" onClick={closeMenu}>Home</Link></li>
            <li><Link to="/directory" onClick={closeMenu}>Directory</Link></li>
            <li><Link to="/blogs" onClick={closeMenu}>Blogs</Link></li>
            <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
            <li><Link to="/discussion" onClick={closeMenu}>Discussion Board</Link></li>
            <li><Link to="/create" onClick={closeMenu}>Create</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
          </ul>
        )}

        <div className={styles.hamburgerAuthButtons}>
          {user ? (
            <>
              <Signout className={styles.menuLink} closeMenu={closeMenu} />
              <Link to="/account" className={styles.menuLink} onClick={closeMenu}>Account Settings</Link>


              <button className={styles.menuLink} onClick={() => { handleUserDocument(); closeMenu(); }}>
                Update User Document
              </button>
              <button className={styles.menuLink} onClick={() => { setUserRole("admin"); closeMenu(); }}>
                Set as Admin
              </button>
              <button className={styles.menuLink} onClick={() => { setUserRole("normal"); closeMenu(); }}>
                Set as Normal
              </button>
              {(user?.role === "admin" || user?.role === "moderator") && (
                <Link to="/modview" className={styles.menuLink} onClick={closeMenu}>
                  ModView Dashboard
                </Link>
              )}

            </>
          ) : (
            <>
              <Link to="/login" className={styles.menuLink} onClick={closeMenu}>Log In</Link>
              <Link to="/signup" className={styles.menuLink} onClick={closeMenu}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
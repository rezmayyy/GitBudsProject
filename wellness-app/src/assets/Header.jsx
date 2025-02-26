import { Link, useNavigate } from "react-router-dom";
import React, { useContext, useState, useEffect, useRef } from "react";
import "../styles/header.css"; // General styles
import styles from "../styles/HamburgerMenu.module.css"; //Hamburger Menu
import logo from "./Logo.png";
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
    const hamburgerRef = useRef(null);
    const [profilePic, setProfilePic] = useState(dummyPic);

    // Load user profile picture
    useEffect(() => {
        if (user?.profilePicUrl) {
            const img = new Image();
            img.src = user.profilePicUrl;
            img.onload = () => setProfilePic(user.profilePicUrl);
            img.onerror = () => setProfilePic(dummyPic);
        }
    }, [user?.profilePicUrl]);

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };
    const handleProfileClick = (event) => {
        // If the user is not logged in, redirect them to the login page
        if (!user) {
            event.preventDefault();
            navigate("/login");
        }
    };
    useEffect(() => {
        if (!user) {
            closeMenu();
        }
    }, [user]);

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
        document.addEventListener("mouseup", handleClickOutside);
        return () => {
            document.removeEventListener("mouseup", handleClickOutside);
        };
    }, [menuOpen]);

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
        }
    };

    // Firestore function to create/update user document
    const handleUserDocument = async () => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userData = {
                email: user.email,
                displayName: user.displayName,
            };

            try {
                await setDoc(userRef, userData, { merge: true });
                console.log("User document created/updated successfully!");
            } catch (error) {
                console.error("Error creating/updating user document:", error);
            }
        }
    };

    // Firestore function to set user role
    const setUserRole = async (role) => {
        if (user) {
            try {
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, { role }, { merge: true });
                console.log(`User role updated to ${role}`);
            } catch (error) {
                console.error("Error updating user role:", error);
            }
        }
    };

    return (
      <header>
        <div className="brand-container">
          <Link to="/">
            <img src={logo} alt="TribeWell Logo" className="logo" />
          </Link>
          <Link style={{ textDecoration: "none" }} to="/">
            <h1 style={{ align: "center", color: "white" }}>TribeWell</h1>
          </Link>
        </div>
        <nav>
          <div className="nav-center">
            <input
              type="text"
              placeholder="Search..."
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/explore">Explore</Link>
              </li>
              <li>
                <Link to="/learn">Learn</Link>
              </li>
              <li>
                <Link to="/blogs">Blogs</Link>
              </li>
              <li>
                <Link to="/profile" onClick={handleProfileClick}>
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/discussion">Discussion Board</Link>
              </li>
              <li>
                <Link to="/create-post">Create</Link>
              </li>
              <li>
                <Link to="/account">Account</Link>
              </li>
            </ul>
          </div>
          <div className="auth-buttons">
            {!user && (
              <>
                <Link to="/login" className="auth-button">
                  Log In
                </Link>
                <Link to="/signup" className="auth-button">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className={styles.hamburgerContainer}>
            <button
              ref={hamburgerRef}
              onClick={toggleMenu}
              className={styles.hamburgerButton}
            >
              ☰
            </button>
            {user && (
              <img
                src={profilePic}
                alt="Profile"
                className={styles.profilePicture}
                onClick={toggleMenu}
              />
            )}
            <div
              ref={menuRef}
              className={`${styles.menuContent} ${
                menuOpen ? styles.active : ""
              }`}
            >
              <button className={styles.closeButton} onClick={closeMenu}>
                ✖
              </button>
              <ul className={styles.hamburgerNavLinks}>
                <li>
                  <Link to="/" onClick={closeMenu}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/explore" onClick={closeMenu}>
                    Explore
                  </Link>
                </li>
                <li>
                  <Link to="/learn" onClick={closeMenu}>
                    Learn
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" onClick={closeMenu}>
                    Blogs
                  </Link>
                </li>
                <li>
                  <Link to="/discussion">Discussion Board</Link>
                </li>
                <li>
                  <Link to="/create-post" onClick={closeMenu}>
                    Create
                  </Link>
                </li>
                <li>
                  <Link to="/account" onClick={closeMenu}>
                    Account
                  </Link>
                </li>
              </ul>
              <div className={styles.hamburgerAuthButtons}>
                {user ? (
                  <>
                    <Link
                      to="/account"
                      className={styles.menuLink}
                      onClick={closeMenu}
                    >
                      {user.displayName}
                    </Link>
                    <Signout
                      className={styles.menuLink}
                      closeMenu={closeMenu}
                    />
<<<<<<< HEAD
<<<<<<< HEAD
                    {/* Navigation links */}
                    <ul className="nav-links">
<<<<<<< HEAD
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/explore">Explore</Link></li>
                        <li><Link to="/Courses">Courses</Link></li>
                        <li><Link to="/profile" onClick={handleProfileClick}>Profile</Link></li>
                        <li><Link to="/discussion">Discussion Board</Link></li>
                        <li><Link to="/create-post">Create</Link></li>
                        <li><Link to="/account">Account</Link></li>
=======
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/explore">Explore</Link>
                        </li>
                        <li>
                            <Link to="/learn">Learn</Link>
                        </li>
                        <li>
                            <Link to="/blogs">Blogs</Link>
                        </li>
                        <li>
                            <Link to="/profile" onClick={handleProfileClick}>
                                Profile
                            </Link>
                        </li>
                        <li>
                            <Link to="/discussion">Discussion Board</Link>
                        </li>
                        <li>
                            <Link to="/create-post">Create</Link>
                        </li>
                        <li>
                            <Link to="/account">Account</Link>
                        </li>
>>>>>>> 19c7396 (fix(header/navbar): improve mobile scaling & responsiveness (SCRUM-207, SCRUM-208, SCRUM-209))
                    </ul>
                </div>
                <div className="auth-buttons">
                    {/* Conditional rendering based on user authentication */}
                    {!user ? (
                        // If no user is logged in, show Log In and Sign Up buttons
                        <>
                            <Link to="/login" className="auth-button">
                                Log In
                            </Link>
                            <Link to="/signup" className="auth-button">
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        // If a user is logged in, show the Signout component
                        <Signout Link to="/" className="auth-button">
                            Sign out
                        </Signout>
                    )}
                </div>
                <div className="hamburger-container">
                    {/* Conditional rendering for hamburger button */}
=======
>>>>>>> 420933a (SCRUM-207, SCRUM-208, SCRUM-209: Integrated UI and Sidebar Enhancements)
=======
>>>>>>> 65fd0678275fd629adf288d986c3306d051d3b2e
                    <button
                      className={styles.menuLink}
                      onClick={() => {
                        handleUserDocument();
                        closeMenu();
                      }}
                    >
                      Create/Update User Document
                    </button>
                    <button
                      className={styles.menuLink}
                      onClick={() => {
                        setUserRole("admin");
                        closeMenu();
                      }}
                    >
                      Set as Admin
                    </button>
                    <button
                      className={styles.menuLink}
                      onClick={() => {
                        setUserRole("normal");
                        closeMenu();
                      }}
                    >
                      Set as Normal
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className={styles.menuLink}
                      onClick={closeMenu}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className={styles.menuLink}
                      onClick={closeMenu}
                    >
                      Sign Up
                    </Link>
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

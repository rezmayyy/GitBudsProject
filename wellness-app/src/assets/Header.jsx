import { Link } from 'react-router-dom';
import React, {useContext} from 'react';
import '../styles/header.css';
import logo from '../assets/Logo.png';
import UserContext from './UserContext';
import Signout from './Signout';

function Header() {
    const {user} = useContext(UserContext);
    return (
        <header>
            {/* Div for Logo and "TribeWell" */}
            <div className="brand-container">
                <img src={logo} alt="TribeWell Logo" className="logo" />
                <h1>TribeWell</h1>
            </div>
            <nav>
                {/* Div for Search bar and navlinks */}
                <div className="nav-center">
                    <input type="text" placeholder="Search..." className="search-bar" />
                    <ul className="nav-links">
                        <li><Link to="/explore">Explore</Link></li>
                        <li><Link to="/learn">Learn</Link></li>
                        <li><Link to="/blogs">Blogs</Link></li>
                        <li><Link to="/profile">Profile</Link></li>

                    </ul>
                </div>
                <ul className="auth-links">
                    <>
                        {user ? (
                            <>
                        <li>{user && <p>Signed in as: {user.displayName}</p>}</li>
                        <li><Signout></Signout></li>
                            </>
                        ):(
                            <>
                            <li><Link to="/login">Log In</Link></li>
                            <li><Link to="/signup">Sign Up</Link></li>
                            </>
                        )}
                    </>
                        
                    
                </ul>
            </nav>
        </header>
    )
}

export default Header
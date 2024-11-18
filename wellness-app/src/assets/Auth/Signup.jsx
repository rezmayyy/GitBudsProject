import React from "react";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/login.css";
import "../../styles/guide.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { auth} from "../Firebase";
import {createUserWithEmailAndPassword, updateProfile} from 'firebase/auth'
import { getFirestore, setDoc, doc } from 'firebase/firestore'; // Import Firestore functions
import UserContext from "../UserContext";

function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); 
    const [error, setError] = useState('');
    const {setUser} = useContext(UserContext);

    // Initialize Firestore
    const db = getFirestore();

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleDisplayNameChange = (e) => {
        setDisplayName(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update user profile with display name
            await updateProfile(auth.currentUser, { displayName: displayName });
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                displayName: displayName,
                status: 'active' // Set default status
            });

            // Update User Context and navigate
            setUser(user);
            navigate("/");
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            setError(errorMessage);
        }
    };

    return (
        <div className="Signup">
            <div className="wrapper">
                <div className="form-box register">
                    <form onSubmit={handleSubmit}>
                        <h1>Sign Up</h1>
                        {error && <p className="error">{error}</p>}
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Display Name"
                                required
                                value={displayName}
                                onChange={handleDisplayNameChange}
                            />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={handleEmailChange}
                            />
                            <FaEnvelope className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={handlePasswordChange}
                            />
                            <FaLock className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                required
                            />
                            <FaLock className="icon" />
                        </div>

                        <div className="tos-agree">
                            <label>
                                <input type="checkbox" required />
                                I agree to the <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>.
                            </label>
                        </div>

                        <button type="submit">Sign Up</button>

                        <div className="login-link">
                            <p>
                                Already have an account? 
                                <Link to="/login"> Login</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;

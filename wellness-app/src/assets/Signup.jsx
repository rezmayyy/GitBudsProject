import React from "react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/login.css";
import "../styles/guide.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { auth} from "../assets/Firebase";
import {createUserWithEmailAndPassword} from 'firebase/auth'
import UserContext from "./UserContext";

function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [displayName, setDisplayName] = React.useState(''); 
    const [error, setError] = React.useState('');
    const {setUser, setUserDisplayName} = useContext(UserContext);

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
        await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            setUser(user);
            navigate("/")
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            setError(errorMessage);
        });
    };

    return (
        <div className="Signup">
            <div className="wrapper">
                <div className="form-box register">
                    <form onSubmit={handleSubmit}>
                        <h1>Sign Up</h1>
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
                                placeholder="Re-enter password"
                                required
                            />
                            <FaLock className="icon" />
                        </div>

                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" />
                                I agree to the terms & conditions
                            </label>
                        </div>

                        <button type="submit">Sign Up</button>

                        <div className="register-link">
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

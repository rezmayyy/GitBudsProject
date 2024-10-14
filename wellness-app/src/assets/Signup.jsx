import React from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";
import "../styles/guide.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";

function Signup() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleFullNameChange = (e) => {
        setFullName(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Insert firebase signup logic here, with routing to home page on success
        console.log('Signup attempted with:', fullName, email, password);
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
                                placeholder="Full name"
                                required
                                value={fullName}
                                onChange={handleFullNameChange}
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

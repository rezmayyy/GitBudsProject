import React from "react";
import { Link } from "react-router-dom"; // Keep only one import statement for Link
import "../styles/login.css";
import "../styles/guide.css";
import { FaUser, FaLock } from "react-icons/fa";

function Login() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Insert firebase login logic here, with routing to home page on success
        console.log('Login attempted with:', email, password);
    };

    return (
        <div className="Home">
            <div className="wrapper">
                <div className="form-box login">
                    <form onSubmit={handleSubmit}>
                        <h1>Login</h1>
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={email}
                                onChange={handleEmailChange}
                            />
                            <FaUser className="icon" />
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

                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" /> Remember me
                            </label>
                            <Link to="#">Forgot password?</Link>
                        </div>

                        <button type="submit">Login</button>

                        <div className="register-link">
                            <p>
                                Don't have an account? 
                                <Link to="/signup"> Sign Up</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;

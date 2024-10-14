import "../styles/login.css";
import "../styles/guide.css";
import {FaUser, FaLock} from "react-icons/fa";
import {Link} from 'react-router-dom';

//import './login.css';
import React from "react";
import { Link } from "react-router-dom";
function Login(){

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


    return(
        <div className="Home">


            <div className="wrapper">

                <div className="form-box login">
                    <form action="">
                        <h1>Login</h1>
                        <div className="input-box">
                            <input type="text" placeholder="Username" required />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Password" required />
                            <FaLock className="icon"/>
                        </div>
                        
                        <div className="remember-forgot">
                            <label><input type="checkbox"/>Remember me</label>
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
        
        <div>
            <h2>Log In Page</h2>
            <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                />
            </div>
            <button type="submit">Log In</button>
            </form>
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
        </div>
    );
}

export default Login;
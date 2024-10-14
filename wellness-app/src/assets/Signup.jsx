import "../styles/login.css";
import "../styles/guide.css";
import {FaUser, FaLock, FaEnvelope} from "react-icons/fa";
import {Link} from 'react-router-dom';

function Signup() {

    return (

        <div className="Signup">

            <div className="wrapper">


                <div classname="form-box register">
                    <form action="">
                        <h1>Sign Up</h1>
                        <div className="input-box">
                            <input type="text" placeholder="Full name" required />
                            <FaUser className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="email" placeholder="Email" required />
                            <FaEnvelope className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Password" required />
                            <FaLock className="icon" />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder="Re-enter password" required />
                            <FaLock className="icon" />
                        </div>

                        <div className="remember-forgot">
                            <label><input type="checkbox" />
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
import React from "react";
import { Link } from "react-router-dom";



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
       // Insert firebase signup logic here, with routing to home page on success
        console.log('Signup attempted with:', email, password);
    };
    return(
        <div>
            <h2>Sign Up Page</h2>
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
            <button type="submit">Sign Up</button>
            </form>
            <p>Already have an account? <Link to="/login">Log in here</Link></p>
        </div>
    );
}

export default Signup;
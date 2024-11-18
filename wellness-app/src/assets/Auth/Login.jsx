import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // Keep only one import statement for Link
import "../../styles/login.css";
import "../../styles/guide.css";
import { FaUser, FaLock } from "react-icons/fa";
import {auth} from "../Firebase";
import {signInWithEmailAndPassword} from 'firebase/auth'
import UserContext from "../UserContext";


function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const {setUser} = useContext(UserContext);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          console.log(user);
          setUser(user);
          //setDisplayName
          navigate('/')
        } catch (error) {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorCode, errorMessage);
        }
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
                                placeholder="Email"
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
                            <Link to="/recover">Forgot password?</Link>
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

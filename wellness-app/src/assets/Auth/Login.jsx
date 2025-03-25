import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { auth } from "../Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import UserContext from "../UserContext";
import "../../styles/auth.css";

function Login() {
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // reset previous

        try {
            const { user } = await signInWithEmailAndPassword(auth, email, password);
            setUser(user);
            navigate("/");
        } catch (err) {
            switch (err.code) {
                case "auth/user-disabled":
                    setError("Your account has been disabled. Contact support.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many login attempts — please try again later.");
                    break;
                case "auth/invalid-email":
                case "auth/user-not-found":
                case "auth/wrong-password":
                default:
                    setError("Invalid email or password.");
            }
            console.error(err.code, err.message);
        }
    };

    return (
        <div className="Home">
            <div className="wrapper">
                <div className="form-box login">
                    <form onSubmit={handleSubmit}>
                        <h1>Login</h1>

                        <div className="input-box">
                            <FaUser className="icon" />
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-box">
                            <FaLock className="icon" />
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit">Login</button>

                        <div className="link">
                            <p>
                                Don’t have an account? <Link to="/signup">Sign Up</Link>
                            </p>
                            <Link to="/recover">Forgot password?</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;

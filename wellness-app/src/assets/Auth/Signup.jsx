import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import "../../styles/guide.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { auth } from "../Firebase";
import UserContext from "../UserContext";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";


function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser } = useContext(UserContext);

  // Initialize Firebase Functions and connect to emulator if needed
  const functions = getFunctions();
  if(process.env.REACT_APP_USE_EMULATOR === "true")
  {
    connectFunctionsEmulator(functions, "localhost", 5001);
  }

  const handleUserSignupCallable = httpsCallable(functions, "handleUserSignup");

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleDisplayNameChange = (e) => setDisplayName(e.target.value);

  // Function to validate password strength
  const validatePassword = (password) => {
    // Must be at least 8 characters, contain one uppercase, one number, and one special character.
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password on the client side
    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters long, contain at least one capital letter, one number, and one special character."
      );
      return;
    } else {
      setPasswordError("");
    }

    try {
      // Call the Cloud Function to create the user
      const result = await handleUserSignupCallable({
        email,
        password,
        displayName,
      });
      console.log(result.data.message);
      
      // Get the custom token returned from the function
      const customToken = result.data.token;
      
      // Sign in the user with the custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      const user = userCredential.user;
      setUser(user);
      navigate("/");
    } catch (error) {
      console.error("Error during signup:", error);
      setError(error.message);
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
            {passwordError && (
              <div style={{ color: "red", marginTop: "5px" }}>{passwordError}</div>
            )}
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                required
              />
              <FaLock className="icon" />
            </div>
            <div className="checkbox">
              <label>
                <input type="checkbox" required /> I agree to the{" "}
                <Link to="/TOS" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </Link>.
              </label>
            </div>
            <button type="submit">Sign Up</button>
            <div className="link">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;

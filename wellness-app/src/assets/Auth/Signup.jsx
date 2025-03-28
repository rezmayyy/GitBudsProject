import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/auth.css";
import "../../styles/guide.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { auth } from "../Firebase";
import UserContext from "../UserContext";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { signInWithCustomToken, sendEmailVerification } from "firebase/auth";

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { setUser } = useContext(UserContext);

  // Initialize Firebase Functions and connect to emulator if needed
  const functions = getFunctions();
  if (process.env.REACT_APP_USE_EMULATOR === "true") {
    connectFunctionsEmulator(functions, "localhost", 5001);
  }

  const handleUserSignupCallable = httpsCallable(functions, "handleUserSignup");

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleDisplayNameChange = (e) => setDisplayName(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  // Validate password: must have at least 8 characters, one uppercase, one lowercase, one number, and one special character.
  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check password match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    // Validate password strength

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    } else {
      setPasswordError("");
    }

    const displayNameRegex = /^[A-Za-z0-9_-]{3,20}$/;
    if (!displayNameRegex.test(displayName)) {
      setError(
        "Display name must be 3–20 characters long and contain only letters, numbers, hyphens or underscores."
      );
      return;
    }

    try {
      // Call Cloud Function with payload containing email, password, and displayName.
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

      // Send verification email using Firebase's client method
      await sendEmailVerification(user);

      // Navigate to the verification page
      navigate("/verify");
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
                placeholder="Display Name (Public)"
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
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
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

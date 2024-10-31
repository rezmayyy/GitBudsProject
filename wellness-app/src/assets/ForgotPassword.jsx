import React, { useState } from 'react';
import { auth } from './Firebase'; // Adjust the path if needed
import { sendPasswordResetEmail } from 'firebase/auth';
import styles from '../styles/ForgotPassword.module.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setError('');

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset link sent! Check your email.');
        } catch (error) {
            console.error("Error sending password reset email:", error);
            setError('Failed to send password reset email. Please try again.');
        }
    };

    return (
        <div className={styles.forgotPasswordContainer}>
            <div className={styles.formWrapper}>
                <h2 className={styles.title}>Forgot Password</h2>
                {message && <p>{message}</p>}
                <form onSubmit={handlePasswordReset}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        className={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className={styles.submitButton}>Reset Password</button>
                </form>
                <a href="/" className={styles.backLink}>Back to Login</a>
            </div>
        </div>
    );
}

export default ForgotPassword;

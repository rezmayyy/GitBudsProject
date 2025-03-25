import React from 'react';
import { auth } from '../Firebase';
import { sendEmailVerification } from "firebase/auth";
import styles from './Verify.module.css';

const VerifyPage = () => {
    // Resend email verification when user clicks the link.
    const handleResend = async (e) => {
        e.preventDefault();
        try {
            // Pass the current user to sendEmailVerification.
            await sendEmailVerification(auth.currentUser);
            alert("Verification email sent!");
        } catch (error) {
            console.error("Error resending email:", error);
            alert("Error sending email. Please try again later.");
        }
    };

    return (
        <div className={styles["verify-container"]}>
            <h2>Please check your email for the verification link</h2>
            <p>
                Didn’t receive an email?{" "}
                <a href="#resend" onClick={handleResend}>
                    Click here to resend email
                </a>
            </p>
        </div>
    );
};

export default VerifyPage;

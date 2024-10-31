import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/support.module.css'; // Import the CSS module

function Support() {
    return (
        <div className={styles.supportPage}>
            <h1 className={styles.supportTitle}>Support</h1>
            <p>Welcome to the support page! Here you can find assistance with your queries.</p>
            <div>
                <h2 className={styles.supportSectionTitle}>How can we help you?</h2>
                <ul className={styles.supportList}>
                    <li className={styles.supportListItem}>
                        <h3>Frequently Asked Questions (FAQ)</h3>
                        <p>populate with possible questions and asked questions later</p>
                    </li>
                    <li className={styles.supportListItem}>
                        <h3>Create a Support Ticket</h3>
                        <p>
                            If you need further assistance, please create a support ticket by clicking{' '}
                            <Link to="/ticket" className={styles.supportLink}>here</Link>.
                        </p>
                    </li>
                </ul>
            </div>
            <div className={styles.contactInfo}>
                <h2 className={styles.supportSectionTitle}>Contact Us</h2>
                <p>
                    If you still need help, feel free to contact our support team directly at{' '}
                    <a href="mailto:support@tribewell.com" className={styles.supportLink}>support@tribewell.com</a>.
                </p>
            </div>
        </div>
    );
}

export default Support;

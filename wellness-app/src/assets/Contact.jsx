import React from 'react';
import styles from "../styles/Legal.module.css"; 

function Contact() {
    return (
        <div className={styles.legalContainer}>
            <h1 className={styles.legalTitle}>Contact Us</h1>
            <p className={styles.sectionContent}>
                If you still need help, feel free to contact our support team directly at{" "}
                <a href="mailto:support@tribewell.com" className={styles.supportLink}>
                    support@tribewell.com
                </a>.
            </p>
        </div>
    );
}

export default Contact;
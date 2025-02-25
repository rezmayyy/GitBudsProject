import React from 'react';
import styles from '../styles/Legal.module.css'; // Adjust the path as necessary

function Payment() {
    return (
        <div className={styles.legalContainer}>
            <h1 className={styles.legalTitle}>Payment Options</h1>
            <p className={styles.sectionContent}>Payments will be done using Stripe. More info coming soon!</p>
        </div>
    );
}

export default Payment;
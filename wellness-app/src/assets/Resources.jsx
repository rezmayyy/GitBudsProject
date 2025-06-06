import React from 'react';
import styles from '../styles/Legal.module.css'; // Adjust the path as necessary
import DiscussionBoard from './DiscussionBoard/DiscussionBoard';
import FAQ from './ResourceFAQ';

function Resources() {
    return (
        <div className={styles.legalContainer}>
            <h1 className={styles.legalTitle}>Resources</h1>

            <DiscussionBoard />

            <FAQ />
        </div>
    );

}

export default Resources;
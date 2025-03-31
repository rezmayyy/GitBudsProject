import React from 'react';
import styles from '../../styles/Legal.module.css'; // Adjust the path as necessary

function About() {
    return (
        <div className={styles.legalContainer}>
            <h1 className={styles.legalTitle}>About TribeWell</h1>

            <h2 className={styles.sectionTitle}>Synopsis</h2>
            <p className={styles.sectionContent}>
                TribeWell is a platform designed for wellness enthusiasts to explore, learn, and connect through ancient healing wisdom. From Ayurveda to Reiki and Sound Healing, TribeWell provides educational resources, personalized wellness plans, and interactive community features, making it easy for users to enhance their wellness journey. Whether you’re a seasoned practitioner or just starting out, TribeWell brings together a wealth of knowledge and a vibrant community in one place.
            </p>

            <h2 className={styles.sectionTitle}>Features</h2>
            <ul className={styles.sectionContent}>
                <li>Diverse Healing Modalities: Access a library of ancient healing practices, including Ayurveda, Reiki, and Sound Healing.</li>
                <li>Educational Content: Explore introductory courses, articles, and videos tailored for wellness education.</li>
                <li>Community Engagement: Participate in forums, live Q&A sessions, and discussions with other wellness enthusiasts.</li>
                <li>Personalized Experience: Tailor your healing journey with customizable plans and progress tracking.</li>
                <li>Modern Technology Integration: Access TribeWell on a responsive website and mobile app.</li>
            </ul>
        </div>
    );

}

export default About;
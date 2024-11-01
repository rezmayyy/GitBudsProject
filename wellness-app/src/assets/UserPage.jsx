import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../styles/UserPage.module.css';

function UserPage() {
    const { username } = useParams(); // Get the dynamic username from the URL
    const [activeTab, setActiveTab] = useState('posts');
    const [postFilter, setPostFilter] = useState('all');

    // Dynamic profile image URL - default placeholder if empty
    const profileImage = ''; // Update with actual image link logic

    const handleTabClick = (tab) => setActiveTab(tab);
    const handleFilterChange = (filter) => setPostFilter(filter);

    return (
        <div className={styles.userPage}>
            <div className={styles.banner}>
                <div className={styles.profileImageWrapper}>
                    <img
                        src={profileImage || 'https://via.placeholder.com/150'}
                        alt={`${username}'s profile`}
                        className={styles.profileImage}
                    />
                </div>
            </div>

            <div className={styles.navLinks}>
                <button onClick={() => handleTabClick('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
                <button onClick={() => handleTabClick('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
                <button onClick={() => handleTabClick('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
            </div>

            <div className={styles.contentArea}>
                {activeTab === 'posts' && (
                    <div>
                        <div className={styles.dropdown}>
                            <label>Filter by:</label>
                            <select
                                className={styles.dropdownSelect}
                                value={postFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="video">Video</option>
                                <option value="audio">Audio</option>
                                <option value="text">Text</option>
                            </select>
                        </div>
                        <div className={styles.postsContainer}>
                            <p>Displaying {postFilter} posts for {username}...</p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className={styles.aboutSection}>
                        <h3>About {username}</h3>
                        <p>This is the user's bio information.</p>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className={styles.contactSection}>
                        <h3>Contact {username}</h3>
                        <p>This is the user's contact information.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPage;

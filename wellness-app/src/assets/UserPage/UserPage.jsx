import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../styles/UserPage.module.css';
import dummyPic from './dummyPic.jpeg'; // Import the default profile picture
import UserPosts from './UserPosts';
import UserVideos from './UserVideos';
import UserAudio from './UserAudio';
import UserText from './UserText';

function UserPage() {
    const { username } = useParams(); // Get the dynamic username from the URL
    const [activeTab, setActiveTab] = useState('posts');
    const [postFilter, setPostFilter] = useState('all');
    const [hasShop] = useState(true); // State to check if user has a shop, default to true for testing
    const [isMod] = useState(true); // State to check if viewer is a mod, default to true for testing

    // Dynamic profile image URL - default to dummyPic if empty
    const profileImage = ''; // Update with actual image link logic

    const handleTabClick = (tab) => setActiveTab(tab);
    const handleFilterChange = (filter) => setPostFilter(filter);

    return (
        <div className={styles.userPage}>
            <div className={styles.banner}>
                <div className={styles.profileImageWrapper}>
                    <img
                        src={profileImage || dummyPic} // Use dummyPic as the default profile picture
                        alt={`${username}'s profile`}
                        className={styles.profileImage}
                    />
                </div>
            </div>

            <div className={styles.navLinks}>
                <button onClick={() => handleTabClick('posts')} className={`${styles.navButton} ${activeTab === 'posts' ? styles.active : ''}`}>Posts</button>
                {hasShop && (
                    <button onClick={() => handleTabClick('shop')} className={`${styles.navButton} ${activeTab === 'shop' ? styles.active : ''}`}>Shop</button>
                )}
                <button onClick={() => handleTabClick('about')} className={`${styles.navButton} ${activeTab === 'about' ? styles.active : ''}`}>About</button>
                <button onClick={() => handleTabClick('contact')} className={`${styles.navButton} ${activeTab === 'contact' ? styles.active : ''}`}>Contact</button>
                <button onClick={() => handleTabClick('report')} className={`${styles.navButton} ${activeTab === 'report' ? styles.active : ''}`}>Report</button>
                {isMod && (
                    <button onClick={() => handleTabClick('modview')} className={`${styles.navButton} ${activeTab === 'modview' ? styles.active : ''}`}>ModView</button>
                )}
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

                            // Display all posts
                            {postFilter == "all" && (
                                <div id="userPosts">
                                    <UserPosts />
                                </div>
                            )}
                            
                            // Display videos only
                            {postFilter == "video" && (
                                <div id="userVideos">
                                    <UserVideos />
                                </div>
                            )}

                            // Display audio only
                            {postFilter == "audio" && (
                                <div id="userAudio">
                                    <UserAudio />
                                </div>                            
                            )}

                            // Display text only
                            {postFilter == "text" && (
                                <div id="userText">
                                    <UserText />
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {activeTab === 'shop' && (
                    <div className={styles.shopSection}>
                        <h3>{username}'s Shop</h3>
                        <div className={styles.productGrid}>
                            {[1, 2, 3].map((product) => (
                                <div key={product} className={styles.productCard}>
                                    <img
                                        src="https://via.placeholder.com/100"
                                        alt="Product Preview"
                                        className={styles.productImage}
                                    />
                                    <div className={styles.productInfo}>
                                        <p className={styles.productName}>Product {product}</p>
                                        <p className={styles.productPrice}>$10.00</p>
                                    </div>
                                </div>
                            ))}
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

                {activeTab === 'report' && (
                    <div className={styles.reportSection}>
                        <h3>Report {username}</h3>
                        <p>If you believe {username} is in violation of our <Link to="/TOS" className={styles.link}>Terms of Service</Link>,
                        please create a support ticket by clicking <Link to="/ticket" className={styles.link}>here</Link>.</p>
                    </div>
                )}

                {activeTab === 'modview' && (
                    <div className={styles.modSection}>
                        <h3>ModView</h3>
                        <p>This is the ModView placeholder.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SearchPage.module.css';

function SearchResults() {
    // State to manage dropdown visibility
    const [activeDropdown, setActiveDropdown] = useState(null);
    const username = "user1"; // This is a placeholder and can be dynamically set later

    // Toggle dropdown based on clicked button
    const toggleDropdown = (dropdown) => {
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    };

    return (
        <div className={styles.pageContainer}>
            {/* Sidebar for Filters */}
            <aside className={styles.sidebar}>
                <h3>Filter Content</h3>
                <div className={styles.filterSection}>
                    <button onClick={() => toggleDropdown('category')} className={styles.dropdownButton}>
                        Category ▼
                    </button>
                    {activeDropdown === 'category' && (
                        <ul className={styles.dropdownContent}>
                            <li><a href="#">Category 1</a></li>
                            <li><a href="#">Category 2</a></li>
                            <li><a href="#">Category 3</a></li>
                        </ul>
                    )}
                </div>
                <div className={styles.filterSection}>
                    <button onClick={() => toggleDropdown('tags')} className={styles.dropdownButton}>
                        Tags ▼
                    </button>
                    {activeDropdown === 'tags' && (
                        <ul className={styles.dropdownContent}>
                            <li><a href="#">Tag 1</a></li>
                            <li><a href="#">Tag 2</a></li>
                            <li><a href="#">Tag 3</a></li>
                        </ul>
                    )}
                </div>
                <div className={styles.filterSection}>
                    <button onClick={() => toggleDropdown('author')} className={styles.dropdownButton}>
                        Author ▼
                    </button>
                    {activeDropdown === 'author' && (
                        <ul className={styles.dropdownContent}>
                            <li><a href="#">Author 1</a></li>
                            <li><a href="#">Author 2</a></li>
                            <li><a href="#">Author 3</a></li>
                        </ul>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                <div className={styles.sortingModule}>
                    <h3>Sort By:</h3>
                    <button className={styles.sortButton}>Date</button>
                    <button className={styles.sortButton}>Rating</button>
                    <button className={styles.sortButton}>Views</button>
                </div>

                <div className={styles.postsContainer}>
                    <div className={styles.post}>
                        <h4>Post Title 1</h4>
                        <p>
                            <Link to={`/user/${username}`} className={styles.userLink}>{username}</Link>
                        </p>
                        <div className={styles.postDetails}>
                            <span>Views: 120</span>
                            <span>Rating: 4.5</span>
                            <span>Date: 2024-10-30</span>
                            <button className={styles.reportButton}>Report</button>
                        </div>
                    </div>
                    <div className={styles.post}>
                        <h4>Post Title 2</h4>
                        <p>
                        <Link to={`/user/${username}`} className={styles.userLink}>{username}</Link>
                        </p>
                        <div className={styles.postDetails}>
                            <span>Views: 85</span>
                            <span>Rating: 4.0</span>
                            <span>Date: 2024-10-29</span>
                            <button className={styles.reportButton}>Report</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SearchResults;

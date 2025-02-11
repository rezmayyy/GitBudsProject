import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SearchPage.module.css';
import UserContext from './UserContext';

// Firestore imports
import { db } from './Firebase'; // adjust the path as needed
import { collection, query, where, getDocs } from 'firebase/firestore';

function SearchResults() {
  // State to manage which dropdown is open
  const [activeDropdown, setActiveDropdown] = useState(null);
  // State for the filter categories (video, audio, articles)
  const [categories] = useState(['video', 'audio', 'articles']);
  // State for the currently selected category (default is "video")
  const [selectedCategory, setSelectedCategory] = useState('video');
  // State for posts retrieved from Firestore
  const [posts, setPosts] = useState([]);
  // State for loading status
  const [loading, setLoading] = useState(true);

  const { user } = useContext(UserContext);

  // Toggle dropdown visibility for a given section
  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Fetch posts from Firestore. If a category is selected, filter by that category.
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        let postsQuery;
        if (selectedCategory) {
          // Query only posts where the "type" field matches the selectedCategory
          postsQuery = query(
            collection(db, "content-posts"),
            where("type", "==", selectedCategory)
          );
        } else {
          // If no category is selected, fetch all posts.
          postsQuery = query(collection(db, "content-posts"));
        }

        const querySnapshot = await getDocs(postsQuery);
        const postsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsArray);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
      setLoading(false);
    }

    fetchPosts();
  }, [selectedCategory]);

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar for Filters */}
      <aside className={styles.sidebar}>
        <h3>Filter Content</h3>
        <div className={styles.filterSection}>
          <button
            onClick={() => toggleDropdown('category')}
            className={styles.dropdownButton}
          >
            Category ▼
          </button>
          {activeDropdown === 'category' && (
            <ul className={styles.dropdownContent}>
              {categories.map((category, index) => (
                <li key={index}>
                  <a
                    href="#"
                    // Apply an "active" CSS class when this category is selected.
                    className={
                      selectedCategory === category ? styles.activeCategory : ''
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      // Toggle the selection: if the category is already selected, deselect it.
                      setSelectedCategory(
                        selectedCategory === category ? null : category
                      );
                    }}
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.filterSection}>
          <button
            onClick={() => toggleDropdown('tags')}
            className={styles.dropdownButton}
          >
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
          <button
            onClick={() => toggleDropdown('author')}
            className={styles.dropdownButton}
          >
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
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className={styles.post}>
                <h4>
                  {/* Link to /content/{post.id} */}
                  <Link to={`/content/${post.id}`}>
                    {post.title}
                  </Link>
                </h4>
                <p>
                  <Link
                    to={`/profile/${post.author}`}
                    className={styles.userLink}
                  >
                    {post.author}
                  </Link>
                </p>
                <div className={styles.postDetails}>
                  <span>Category: {post.category}</span>
                  <span>Views: {post.views}</span>
                  <span>Rating: {post.rating}</span>
                  <span>Date: {post.date}</span>
                  <button className={styles.reportButton}>Report</button>
                </div>
              </div>
            ))
          ) : (
            <p>No posts found for this category.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default SearchResults;

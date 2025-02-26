import React, { useContext, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../styles/SearchPage.module.css';
import UserContext from './UserContext';
import { searchPostsByKeywords } from './searchalg'; // Named export

function SearchResults() {
  // Retrieve the query parameter from the URL (e.g., ?query=dog)
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';

  // State to manage which dropdown is open
  const [activeDropdown, setActiveDropdown] = useState(null);
  // State for the filter categories (video, audio, article)
  const [categories] = useState(['video', 'audio', 'article']);
  // State for the currently selected category
  // When empty, no category filtering is applied.
  const [selectedCategory, setSelectedCategory] = useState('');
  // State for posts returned by the search algorithm
  const [posts, setPosts] = useState([]);
  // State for loading status
  const [loading, setLoading] = useState(true);

  const { user } = useContext(UserContext);
  const [sortMethod, setSortMethod] = useState('date'); // Default sorting method


  // Toggle dropdown visibility for the category filter
  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Fetch posts using the static search algorithm whenever the URL query or selectedCategory changes.
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        // Use the URL query as the search string.
        const results = await searchPostsByKeywords(urlQuery, sortMethod);
        // Filter the results by type if a category is selected.
        const filteredResults = selectedCategory
          ? results.filter(post => post.type === selectedCategory)
          : results;
        setPosts(filteredResults);
      } catch (error) {
        console.error("Error fetching posts from searchalg:", error);
      }
      setLoading(false);
    }
    fetchPosts();
  }, [urlQuery, selectedCategory, sortMethod]);

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
                    className={selectedCategory === category ? styles.activeCategory : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      // If clicked category is already selected, unselect it (show all posts)
                      if (selectedCategory === category) {
                        setSelectedCategory('');
                      } else {
                        setSelectedCategory(category);
                      }
                    }}
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
      <div className={styles.sortingModule}>
        <h3>Sort By:</h3>
        <button 
          className={`${styles.sortButton} ${sortMethod === 'date' ? styles.activeSort : ''}`} 
          onClick={() => setSortMethod('date')}
        >
          Date
        </button>
        <button 
          className={`${styles.sortButton} ${sortMethod === 'rating' ? styles.activeSort : ''}`} 
          onClick={() => setSortMethod('rating')}
        >
          Rating
        </button>
        <button 
          className={`${styles.sortButton} ${sortMethod === 'views' ? styles.activeSort : ''}`} 
          onClick={() => setSortMethod('views')}
        >
          Views
        </button>
      </div>
        <div className={styles.postsContainer}>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className={styles.post}>
                {post.thumbnailURL && (
                  <div className={styles.thumbnailContainer}>
                    <img
                      src={post.thumbnailURL}
                      alt={`${post.title} thumbnail`}
                      className={styles.thumbnail}
                    />
                  </div>
                )}
                <div className={styles.postContent}>
                  <h4>
                    <Link to={`/content/${post.id}`}>
                      {post.title}
                    </Link>
                  </h4>
                  <p>
                    <Link to={`/profile/${post.author}`} className={styles.userLink}>
                      {post.author}
                    </Link>
                  </p>
                  <div className={styles.postDetails}>
                    {post.type && <span>Category: {post.type}</span>}
                    {typeof post.views === 'number' && <span>Views: {post.views}</span>}
                    {Array.isArray(post.likes) && <span>Likes: {post.likes.length}</span>}
                    {Array.isArray(post.dislikes) && <span>Dislikes: {post.dislikes.length}</span>}
                    {post.date?.seconds && (
                      <span>
                        Date: {(() => {
                          const dateObj = new Date(post.date.seconds * 1000);
                          const dateString = dateObj.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          const timeString = dateObj.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                            hour12: true
                          });
                          return `${dateString} at ${timeString} UTC-8`;
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <button className={styles.reportButton}>Report</button>
              </div>
            ))
          ) : (
            <p>No posts found for this search term.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default SearchResults;

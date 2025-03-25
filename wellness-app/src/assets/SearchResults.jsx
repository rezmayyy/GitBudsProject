import React, { useContext, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../styles/SearchPage.module.css';
import UserContext from './UserContext';
import { searchPostsByKeywords } from './searchalg'; // Named export
import { useTags } from "./TagSystem/useTags";

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

  const {tags} = useTags();
  const [selectedTag, setSelectedTag] = useState("");


  // Toggle dropdown visibility for the category filter
  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Fetch posts using the static search algorithm whenever the URL query or selectedCategory changes.
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        let results = await searchPostsByKeywords(urlQuery, sortMethod, selectedTag);
  
        //category
        if (selectedCategory) {
          results = results.filter(post => post.type === selectedCategory);
        }
  
        //tags/topics
        if (selectedTag) {
          results = results.filter(post => post.tags?.includes(selectedTag));
        }
  
        setPosts(results);

      } catch (error) {
        console.error("Error fetching posts:", error);
      }
      setLoading(false);
    }
    fetchPosts();
  }, [urlQuery, selectedCategory, selectedTag, sortMethod]); 
  

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar for Filters */}
      <aside className={styles.sidebar}>
        <h3>Filter Content</h3>
        {/* filter by category */}
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
        {/* filter by topic */}
        <div className={styles.filterSection}>
          <button
            onClick={() => toggleDropdown('topic')}
            className={styles.dropdownButton}
          >
            Topic ▼
          </button>
          {activeDropdown === 'topic' && (
            <ul className={styles.dropdownContent}>
              {tags.map((tag) => (
                <li key={tag.value}>
                  <a
                    href="#"
                    className={selectedTag === tag.value ? styles.activeCategory : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      // If clicked category is already selected, unselect it (show all posts)
                      setSelectedTag(selectedTag === tag.value ? '' : tag.value);

                    }}
                  >
                    {tag.label}
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

                    {post.tags?.length > 0 && (
                      <div className="tags">
                        {post.tags?.map((tagId, index) => (
                      <span key={index} className="badge" style={{backgroundColor: '#e0e0e0', color: '#333', marginRight: '8px'}}>
                        {tags.find(tag => tag.value === tagId)?.label || "Unknown Tag" }
                      </span>
                    ))}
                      </div>
                    )}
                    
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

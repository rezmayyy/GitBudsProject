// SearchResults.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../styles/SearchPage.module.css';
import UserContext from './UserContext';
import { searchPostsByKeywords } from './searchalg';
import { useTags } from "./TagSystem/useTags";

function SearchResults() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [categories] = useState(['video', 'audio', 'article']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMethod, setSortMethod] = useState('date');

  const { user } = useContext(UserContext);
  const { tags } = useTags();

  const toggleDropdown = dropdown => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        // Only pass query + sort to searchalg
        let results = await searchPostsByKeywords(urlQuery, sortMethod);

        // then filter by category locally
        if (selectedCategory) {
          results = results.filter(post => post.type === selectedCategory);
        }

        // then filter by topic (tag) locally
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
  }, [urlQuery, sortMethod, selectedCategory, selectedTag]);

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar Filters */}
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
              {categories.map((cat, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className={selectedCategory === cat ? styles.activeCategory : ''}
                    onClick={e => {
                      e.preventDefault();
                      setSelectedCategory(selectedCategory === cat ? '' : cat);
                    }}
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.filterSection}>
          <button
            onClick={() => toggleDropdown('topic')}
            className={styles.dropdownButton}
          >
            Topic ▼
          </button>
          {activeDropdown === 'topic' && (
            <ul className={styles.dropdownContent}>
              {tags.map(tag => (
                <li key={tag.value}>
                  <a
                    href="#"
                    className={selectedTag === tag.value ? styles.activeCategory : ''}
                    onClick={e => {
                      e.preventDefault();
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

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.sortingModule}>
          <h3>Sort By:</h3>
          {['date', 'rating', 'views'].map(method => (
            <button
              key={method}
              className={`${styles.sortButton} ${sortMethod === method ? styles.activeSort : ''}`}
              onClick={() => setSortMethod(method)}
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.postsContainer}>
          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length > 0 ? (
            posts.map(post => (
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
                    <Link to={`/content/${post.id}`}>{post.title}</Link>
                  </h4>
                  <p>
                    <Link to={`/profile/${post.author}`} className={styles.userLink}>
                      {post.author}
                    </Link>
                  </p>
                  <div className={styles.postDetails}>
                    {post.type && <span>Category: {post.type}</span>}
                    {post.tags?.length > 0 && (
                      <div className={styles.tagList}>
                        {post.tags.map((t, i) => (
                          <span key={i} className={styles.badge}>{tags.find(tag => tag.value === t)?.label || t}</span>
                        ))}
                      </div>
                    )}
                    {typeof post.views === 'number' && <span>Views: {post.views}</span>}
                    {typeof post.likesCount === 'number' && <span>Likes: {post.likesCount}</span>}
                    {post.timestamp?.seconds && (
                      <span>
                        Date: {new Date(post.timestamp.seconds * 1000).toLocaleString()}
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

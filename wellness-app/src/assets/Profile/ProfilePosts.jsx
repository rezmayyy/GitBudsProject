import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { db } from '../Firebase';
import DOMPurify from 'dompurify';
import styles from '../../styles/profilePosts.module.css';

const ProfilePosts = () => {
  const { username } = useParams(); // visited user's displayName
  const [activeFilter, setActiveFilter] = useState('video'); // "video", "audio", or "article"
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts for the visited user with the chosen filter
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'content-posts');
        const q = query(
          postsRef,
          where('author', '==', username),
          where('type', '==', activeFilter),
          where('status', '==', 'approved'),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [username, activeFilter]);

  // Render a single post card based on its type
  const renderPostCard = (post) => {
    return (
      <div key={post.id} className={styles.postCard}>
        {/* Title as a hyperlink */}
        <h3 className={styles.postTitle}>
          <Link to={`/content/${post.id}`}>{post.title}</Link>
        </h3>
        
        {/* For videos and audio, show a thumbnail if available */}
        {(activeFilter === 'video' || activeFilter === 'audio') && (
          post.thumbnailURL ? (
            <img
              src={post.thumbnailURL}
              alt={`${post.title} thumbnail`}
              className={styles.postThumbnail}
            />
          ) : (
            <div className={styles.noThumbnail}>No Thumbnail</div>
          )
        )}

        {/* For articles, show the body as sanitized HTML */}
        {activeFilter === 'article' && (
          <div
            className={styles.articlePreview}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
          ></div>
        )}

        {/* Post stats: likes and views */}
        <div className={styles.postStats}>
          <span>Likes: {Array.isArray(post.likes) ? post.likes.length : 0}</span>
          <span>Views: {typeof post.views === 'number' ? post.views : 0}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.profilePostsContainer}>
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterButton} ${activeFilter === 'video' ? styles.active : ''}`}
          onClick={() => setActiveFilter('video')}
        >
          Video
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'audio' ? styles.active : ''}`}
          onClick={() => setActiveFilter('audio')}
        >
          Audio
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'article' ? styles.active : ''}`}
          onClick={() => setActiveFilter('article')}
        >
          Articles
        </button>
      </div>
      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length > 0 ? (
        <div className={styles.postsGrid}>
          {posts.map(post => renderPostCard(post))}
        </div>
      ) : (
        <p>No posts found.</p>
      )}
    </div>
  );
};

export default ProfilePosts;

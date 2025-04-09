// DiscussionBoard.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import UserContext from '../UserContext';
import PostItem from './PostItem';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../Firebase';
import { FaArrowLeft } from 'react-icons/fa';

// Utility function to safely format a timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'No date';
  if (timestamp.toDate) {
    return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
  }
  const dateVal = new Date(timestamp);
  return isNaN(dateVal.getTime()) ? 'No date' : format(dateVal, 'MMM d, yyyy h:mm a');
}

const DiscussionBoard = ({ preview }) => {
  const { user } = useContext(UserContext);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  // Subscribe to posts
  useEffect(() => {
    if (!user) return;
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsList);
    });
    return () => unsubscribe();
  }, [user]);

  // Submit a new post (only saving minimal fields)
  const handlePostSubmit = async () => {
    if (!user) {
      alert('You need to log in to post!');
      navigate('/login');
      return;
    }
    if (newPost.trim()) {
      const newPostItem = {
        message: newPost,
        timestamp: serverTimestamp(),
        userId: user.uid,
      };
      try {
        const docRef = await addDoc(collection(db, 'posts'), newPostItem);
        setPosts([{ ...newPostItem, id: docRef.id }, ...posts]);
        setNewPost('');
      } catch (error) {
        console.error('Error adding document: ', error);
      }
    }
  };

  const displayedPosts = preview ? posts.slice(0, 3) : posts;

  return (
    <div className="discussion-board" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {preview ? '' : 'Discussion Board'}
      </h2>

      {user && !preview && !selectedPost && (
        <>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts..."
            rows="4"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ccc',
              marginBottom: '0.5rem',
            }}
          />
          <br />
          <button
            onClick={handlePostSubmit}
            style={{
              backgroundColor: '#6c63ff',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Post
          </button>
        </>
      )}

      <div style={{ paddingTop: '20px' }} className="posts-list">
        {user ? (
          selectedPost ? (
            <div>
              <button onClick={() => setSelectedPost(null)}><FaArrowLeft /></button>
              <PostItem post={selectedPost} expanded={true} />
            </div>
          ) : (
            displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onExpand={() => setSelectedPost(post)}
                  preview={preview}
                  expanded={selectedPost === post}
                />
              ))
            ) : (
              <p>No posts yet. Be the first to share!</p>
            )
          )
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p>You must be a member to see the discussion board.</p>
            <div style={{ marginTop: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  marginRight: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '30px',
                  backgroundColor: '#6c63ff',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '30px',
                  backgroundColor: '#6c63ff',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="view-board-button">
        {user && preview && (
          <button onClick={() => navigate('/discussion')}>View Discussion Board</button>
        )}
      </div>
    </div>
  );
};

export default DiscussionBoard;

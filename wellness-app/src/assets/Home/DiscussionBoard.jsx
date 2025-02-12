import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import PostItem from '../PostItem';
import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';

const DiscussionBoard = ({ preview }) => { 
  const { user } = useContext(UserContext);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      
      try {
        const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsList = postsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setPosts(postsList); 
      } catch (error) {
        console.error('Error fetching posts: ', error);
      }
    };
    fetchPosts();
  }, [user]);

  const handlePostSubmit = async () => {
    if (!user) {
      alert('You need to log in to post!');
      navigate('/login');
      return;
    }

    if (newPost.trim()) {
      const newPostItem = {
        message: newPost,
        timestamp: Timestamp.now(),
        userName: user.displayName || user.email,
        userId: user.uid,
        replies: [],
        likes: 0,
        likedByUser: false,
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
    <div className="discussion-board">
      <h2>{preview ? 'Latest Discussions' : 'Discussion Board'}</h2>

      {user && !preview && (
        <>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your thoughts..."
            rows="5"
          />
          <button onClick={handlePostSubmit}>Post</button>
        </>
      )}

      <div style={{paddingTop: '20px'}} className="posts-list">
        {user ? (
          displayedPosts.length > 0 ? (
            displayedPosts.map((post) => (
              <PostItem key={post.id} post={post} preview={preview} />
            ))
          ) : (
            <p>No posts yet. Be the first to share!</p>
          )
        ) : (
          <div>
            <p>You must be a member to see the discussion board.</p>
            <div className="auth-buttons">
              <Link to="/login" className="auth-button">Log In</Link>
              <Link to="/signup" className="auth-button">Sign Up</Link>
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
  )
};

export default DiscussionBoard;

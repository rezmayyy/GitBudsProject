import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import PostItem from '../PostItem';
import { collection, addDoc, Timestamp, getDocs, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { FaArrowLeft } from 'react-icons/fa';

const DiscussionBoard = ({ preview }) => {
  const { user } = useContext(UserContext);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
      if (!user) return;

        const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        
        const snap = onSnapshot(postsQuery, (snapshot) => {
          const postsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setPosts(postsList);
        });
        
        return() => snap();
    
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

  const handleReplyAdded = async (postId, updatedReplies) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { replies: updatedReplies });
  };



  return (
    <div className="discussion-board">
      <h2>{preview ? 'Latest Discussions' : 'Discussion Board'}</h2>

      {user && !preview && !selectedPost && (
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

      <div style={{ paddingTop: '20px' }} className="posts-list">
        {user ? (
          selectedPost ? (
            <div>
              <button onClick={() => setSelectedPost(null)}><FaArrowLeft /></button>
              <PostItem post={selectedPost} />
            </div>
          ) : (
            displayedPosts.length > 0 ? (
              displayedPosts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onExpand={() => setSelectedPost(selectedPost === post ? null : post)}
                  preview={preview}
                  expanded={selectedPost === post} 
                  onReplyAdded={handleReplyAdded} />
              ))
            ) : (
              <p>No posts yet. Be the first to share!</p>
            )
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

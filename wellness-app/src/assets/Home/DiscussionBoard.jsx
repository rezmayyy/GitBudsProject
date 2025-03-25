// DiscussionBoard.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import UserContext from '../UserContext';
<<<<<<< HEAD
import { collection, addDoc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';
import ReportButton from '../ReportButton/Report';

// Utility function to safely format a Firestore or non-Firestore timestamp
function formatTimestamp(timestamp) {
  if (!timestamp) return 'No date';

  // If it's a Firestore Timestamp object
  if (timestamp.toDate) {
    return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
  }

  // Otherwise, try converting to a JavaScript Date
  const dateVal = new Date(timestamp);
  if (isNaN(dateVal.getTime())) {
    return 'No date';
  }
  return format(dateVal, 'MMM d, yyyy h:mm a');
}

=======
import PostItem from '../PostItem';
import { collection, addDoc, Timestamp, getDocs, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { FaArrowLeft } from 'react-icons/fa';

>>>>>>> main
const DiscussionBoard = ({ preview }) => {
  const { user } = useContext(UserContext);
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();

  // Fetch posts from Firestore
  useEffect(() => {
      if (!user) return;
<<<<<<< HEAD
      try {
        const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        const postsList = postsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setPosts(postsList);
      } catch (error) {
        console.error('Error fetching posts: ', error);
      }
    };
    fetchPosts();
=======

        const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        
        const snap = onSnapshot(postsQuery, (snapshot) => {
          const postsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setPosts(postsList);
        });
        
        return() => snap();
    
>>>>>>> main
  }, [user]);

  // Submit a new post
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

<<<<<<< HEAD
  // If it's a preview, only show the first 3
  const displayedPosts = preview ? posts.slice(0, 3) : posts;
=======
  const displayedPosts = preview ? posts.slice(0, 3) : posts;

  const handleReplyAdded = async (postId, updatedReplies) => {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { replies: updatedReplies });
  };


>>>>>>> main

  return (
    <div className="discussion-board" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        {preview ? 'Latest Discussions' : 'Discussion Board'}
      </h2>

<<<<<<< HEAD
      {/* New Post Form */}
      {user && !preview && (
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
=======
      {user && !preview && !selectedPost && (
        <>
>>>>>>> main
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
        </div>
      )}

<<<<<<< HEAD
      <div style={{ marginTop: '1rem' }}>
        {user ? (
          displayedPosts.length > 0 ? (
            displayedPosts.map((post) => {
              const postDate = formatTimestamp(post.timestamp);

              return (
                <div
                  key={post.id}
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    border: '1px solid #f8c8dc',
                    borderRadius: '10px',
                    background: '#fffefa',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Top row: user name, date, small report icon if not author */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <strong>{post.userName}</strong>
                      <span style={{ color: '#888', fontSize: '0.9rem' }}>{postDate}</span>
                    </div>
                    {user.uid !== post.userId && (
                      <ReportButton
                        contentUrl={`${window.location.href}#post-${post.id}`}
                        profileUrl={`/profile/${post.userName}`}
                        iconOnly={true}
                      />
                    )}
                  </div>

                  {/* Post message */}
                  <p style={{ margin: 0 }}>{post.message}</p>

                  {/* Replies section */}
                  {post.replies && post.replies.length > 0 && (
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingLeft: '1rem',
                        borderLeft: '2px solid #ddd',
                      }}
                    >
                      {post.replies.map((reply, index) => {
                        const replyDate = formatTimestamp(reply.timestamp);

                        return (
                          <div
                            key={index}
                            style={{
                              marginBottom: '0.75rem',
                              padding: '0.75rem',
                              background: '#fdfdfd',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0',
                            }}
                          >
                            {/* Reply top row */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.25rem',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '1rem',
                                  alignItems: 'center',
                                }}
                              >
                                <strong>{reply.userName}</strong>
                                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                  {replyDate}
                                </span>
                              </div>
                              {user.uid !== reply.userId && (
                                <ReportButton
                                  contentUrl={`${window.location.href}#post-${post.id}-reply-${index}`}
                                  profileUrl={`/profile/${reply.userName}`}
                                  iconOnly={true}
                                />
                              )}
                            </div>

                            {/* Reply message */}
                            <p style={{ margin: 0 }}>{reply.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: 'center' }}>No posts yet. Be the first to share!</p>
=======
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
>>>>>>> main
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

<<<<<<< HEAD
      {/* Button to view the full discussion board if preview */}
      {user && preview && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => navigate('/discussion')}
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
            View Discussion Board
          </button>
        </div>
      )}
=======
      <div className="view-board-button">
        {user && preview && (
          <button onClick={() => navigate('/discussion')}>View Discussion Board</button>
        )}
      </div>
>>>>>>> main
    </div>
  );
};

export default DiscussionBoard;

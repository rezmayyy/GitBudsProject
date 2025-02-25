import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './Firebase'; // Adjust the import path as needed
import styles from '../styles/ModDashboard.module.css';

const ManagePosts = () => {
  const [pendingPosts, setPendingPosts] = useState([]); // Stores the list of posts with 'pending' status
  const [rejectedPosts, setRejectedPosts] = useState([]); // Stores the list of posts with 'rejected' status
  const [loading, setLoading] = useState(true); // Indicates whether the content is still loading
  const [isAdmin, setIsAdmin] = useState(false); // Tracks if the current user has admin privileges
  const [autoApprove, setAutoApprove] = useState(false); // Determines if posts should be auto-approved
  const [viewMode, setViewMode] = useState('pending'); // Tracks whether to display 'pending' or 'rejected' posts

  const auth = getAuth();

  // This effect sets up an authentication listener to check if the user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAdminStatus(user.uid); // Check if the current user is an admin
        fetchAutoApprove(); // Fetch the current auto-approve setting
      } else {
        setIsAdmin(false); // Reset admin status if not logged in
      }
    });

    return () => unsubscribe(); // Cleanup the authentication listener
  }, []);

  // Fetches posts with a status of "pending"
  const fetchPendingPosts = async () => {
    try {
      const postsRef = collection(db, 'content-posts');
      const q = query(postsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingPosts(posts);

      if (autoApprove && posts.length > 0) {
        autoApprovePendingPosts(posts);
      }
    } catch (error) {
      console.error('Error fetching pending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetches posts with a status of "rejected"
  const fetchRejectedPosts = async () => {
    try {
      const postsRef = collection(db, 'content-posts');
      const q = query(postsRef, where('status', '==', 'rejected'));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRejectedPosts(posts);
    } catch (error) {
      console.error('Error fetching rejected posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically approves all pending posts if the auto-approve setting is enabled
  const autoApprovePendingPosts = async (posts) => {
    try {
      for (const post of posts) {
        const postRef = doc(db, 'content-posts', post.id);
        await updateDoc(postRef, { status: 'approved' });
      }
      setPendingPosts([]); // Clear the pending posts after approval
    } catch (error) {
      console.error('Error auto-approving pending posts:', error);
    }
  };

  // Checks if the user has an admin role
  const checkAdminStatus = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Fetches the current auto-approve setting from Firestore
  const fetchAutoApprove = async () => {
    try {
      const settingsRef = doc(db, 'adminSettings', 'uploadRules');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setAutoApprove(settingsSnap.data().AutoApprove);
      }
    } catch (error) {
      console.error('Error fetching auto-approve setting:', error);
    }
  };

  // Toggles the auto-approve setting in Firestore
  const toggleAutoApprove = async () => {
    try {
      const settingsRef = doc(db, 'adminSettings', 'uploadRules');
      await updateDoc(settingsRef, { AutoApprove: !autoApprove });
      setAutoApprove(!autoApprove);
      alert(`AutoApprove setting changed to ${!autoApprove}`);
    } catch (error) {
      console.error('Error toggling auto-approve setting:', error);
    }
  };

  // Runs when the component mounts or when autoApprove changes
  useEffect(() => {
    if (viewMode === 'pending') {
      fetchPendingPosts();
    } else {
      fetchRejectedPosts();
    }
  }, [autoApprove, viewMode]);

  const updatePostStatus = async (postId, newStatus, reason = null) => {
    try {
      const postRef = doc(db, 'content-posts', postId);
      const updateData = { status: newStatus };

      if (reason) {
        updateData.rejectionReason = reason; // Add a rejection reason if provided
      }

      await updateDoc(postRef, updateData);
      setPendingPosts(prev => prev.filter(post => post.id !== postId));
      alert(`Post ${newStatus} successfully.`);
    } catch (error) {
      console.error(`Error updating status for post ${postId}:`, error);
      alert('Failed to update post status.');
    }
  };

  const handleRejectClick = async (postId) => {
    const reason = prompt('Please provide a reason for rejecting this post:');
    
    if (reason === null) {
      alert('Rejection cancelled.');
      return;
    }

    if (!reason.trim()) {
      alert('Rejection reason is required.');
      return;
    }

    await updatePostStatus(postId, 'rejected', reason.trim());
  };

  const handleRestoreClick = async (postId) => {
    await updatePostStatus(postId, 'approved');
  };

  return (
    <div className={styles.manageModuleContainer}>
      <h2>Manage Posts</h2>
      {isAdmin && (
        <div className={styles.adminControls}>
          <button onClick={toggleAutoApprove} className={styles.toggleButton}>
            Toggle AutoApprove ({autoApprove ? 'Enabled' : 'Disabled'})
          </button>
          <button onClick={() => setViewMode('pending')}>View Pending Posts</button>
          <button onClick={() => setViewMode('rejected')}>View Rejected Posts</button>
        </div>
      )}
      <div className={styles.postsWrapper}>
        {loading ? (
          <p>Loading {viewMode} posts...</p>
        ) : viewMode === 'pending' ? (
          pendingPosts.length === 0 ? (
            <p>No pending posts found.</p>
          ) : (
            pendingPosts.map(post => (
              <div key={post.id} className={styles.postCard}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <a 
                  href={`/content/${post.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.viewPostLink}
                >
                  View Full Post
                </a>
                <div className={styles.postActions}>
                  <button 
                    className={styles.approveButton} 
                    onClick={() => updatePostStatus(post.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className={styles.rejectButton} 
                    onClick={() => handleRejectClick(post.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          rejectedPosts.length === 0 ? (
            <p>No rejected posts found.</p>
          ) : (
            rejectedPosts.map(post => (
              <div key={post.id} className={styles.postCard}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p>Rejection Reason: {post.rejectionReason}</p>
                <a 
                  href={`/content/${post.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.viewPostLink}
                >
                  View Full Post
                </a>
                <div className={styles.postActions}>
                  <button 
                    className={styles.approveButton} 
                    onClick={() => handleRestoreClick(post.id)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default ManagePosts;

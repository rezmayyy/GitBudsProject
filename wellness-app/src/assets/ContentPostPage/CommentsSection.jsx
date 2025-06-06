import { useState, useEffect } from 'react';
import { db } from '../Firebase';
import { collection, addDoc, query, getDocs, serverTimestamp } from 'firebase/firestore';
import Comment from './Comment';
import styles from './Comment.module.css';
import dummyPic from '../dummyPic.jpeg';

const CommentsSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [users, setUsers] = useState({});
  const [commentsToShow, setCommentsToShow] = useState(5); // Number of comments to show

  // Fetch all users and comments when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});
      setUsers(usersData);
    };

    const fetchComments = async () => {
      const commentsRef = collection(db, 'content-posts', postId, 'comments');
      const q = query(commentsRef);
      const querySnapshot = await getDocs(q);
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return bTime - aTime; // newest first
      });

      setComments(commentsData);
    };

    fetchUsers();
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const localTimestamp = new Date();
      // Only send the minimal fields; displayName and profilePicUrl will be looked up later.
      const commentData = {
        userId: currentUser.uid,
        text: newComment,
        timestamp: serverTimestamp(),
      };

      const commentRef = await addDoc(collection(db, 'content-posts', postId, 'comments'), commentData);
      setComments([...comments, { ...commentData, id: commentRef.id, timestamp: localTimestamp }]);
      setNewComment('');
    }
  };

  const handleDeleteComment = (commentId) => {
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
  };

  return (
    <div className={styles.commentsContainer}>
      <h3 className={styles.commentsTitle}>Comments</h3>
      {comments.length === 0 ? (
        <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
      ) : (
        comments.slice(0, commentsToShow).map(comment => {
          const user = users[comment.userId];
          return (
            <Comment
              key={comment.id}
              comment={comment}
              user={user} // Comment component will use this lookup.
              currentUser={currentUser}
              postId={postId}
              onDelete={handleDeleteComment}
            />
          );
        })
      )}

      {commentsToShow < comments.length && (
        <button
          className={styles.loadMoreButton}
          onClick={() => setCommentsToShow(commentsToShow + 5)}
        >
          Load More
        </button>
      )}

      {currentUser && (
        <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
          <textarea
            className={styles.commentTextarea}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit" className={styles.postCommentButton}>
            Post Comment
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;

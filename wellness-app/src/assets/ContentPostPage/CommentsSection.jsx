import { useState, useEffect } from 'react';
import { db } from '../Firebase';
import { collection, addDoc, query, getDocs, serverTimestamp } from 'firebase/firestore';
import Comment from './Comment';
import './Comment.css'; // Make sure this file contains the updated styles

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
      }));
      setComments(commentsData);
    };

    fetchUsers();
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const localTimestamp = new Date();
      const commentData = {
        postId,
        userId: currentUser.uid,
        text: newComment,
        timestamp: serverTimestamp(),
        displayName: currentUser.displayName || 'Anonymous',
        profilePicUrl: currentUser.profilePicUrl || 'default-profile-pic-url',
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
    <div className="comments-section">
      <h3>Comments</h3>
      {comments.length === 0 ? (
        <p>No comments yet. Be the first to comment!</p>
      ) : (
        comments.slice(0, commentsToShow).map(comment => {
          const user = users[comment.userId];
          return (
            <Comment
              key={comment.id}
              comment={comment}
              user={user}
              currentUser={currentUser}
              postId={postId}
              onDelete={handleDeleteComment}
            />
          );
        })
      )}

      {commentsToShow < comments.length && (
        <button className="load-more" onClick={() => setCommentsToShow(commentsToShow + 5)}>
          Load More
        </button>
      )}

      {currentUser && (
        <form onSubmit={handleCommentSubmit}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit" className="post-comment-button">Post Comment</button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;

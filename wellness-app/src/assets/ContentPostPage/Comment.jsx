import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteDoc,
  doc,
  addDoc,
  collection,
  getDocs,
  getDoc,
  serverTimestamp,
  setDoc,
  deleteDoc as deleteFirestoreDoc
} from 'firebase/firestore';
import { db } from '../Firebase';
import ReportButton from '../ReportButton/Report';
import styles from './Comment.module.css';
import dummyPic from '../dummyPic.jpeg';

// Define the ReplyItem component to fetch user data based on reply.userId
function ReplyItem({
  reply,
  toggleLikeReply,
  userLikedReplies,
  replyLikesCount,
  currentUser,
  handleDeleteReply
}) {
  const [userData, setUserData] = useState({ displayName: 'Anonymous', profilePicUrl: dummyPic });

  useEffect(() => {
    async function fetchUser() {
      try {
        const userDoc = await getDoc(doc(db, 'users', reply.userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data for reply:", error);
      }
    }
    fetchUser();
  }, [reply.userId]);

  return (
    <div className={styles['reply-container']}>
      <div className={styles['reply-header']}>
        <Link to={`/profile/${reply.userId}`}>
          <img src={userData.profilePicUrl || dummyPic} alt="avatar" width="25" height="25" />
        </Link>
        <Link to={`/profile/${reply.userId}`}>
          <strong>{userData.displayName || 'Anonymous'}</strong>
        </Link>
      </div>
      <p>{reply.text}</p>
      <p>
        <small>
          {reply.timestamp ? new Date(reply.timestamp).toLocaleString() : 'No timestamp'}
        </small>
      </p>
      <div className={styles.likeRow}>
        <span>Likes: {replyLikesCount[reply.id]}</span>
        <span
          className={styles.emojiButton}
          onClick={() => toggleLikeReply(reply.id)}
        >
          {userLikedReplies[reply.id] ? '👎' : '👍'}
        </span>
      </div>
      {currentUser.uid === reply.userId && (
        <button className={styles['delete-button']} onClick={() => handleDeleteReply(reply.id)}>
          Delete
        </button>
      )}
      {currentUser.uid !== reply.userId && (
        <div style={{ textAlign: 'right' }}>
          <ReportButton
            contentUrl={`${window.location.href}#reply-${reply.id}`}
            profileUrl={`/profile/${reply.userId}`}
            iconOnly
          />
        </div>
      )}
    </div>
  );
}

const Comment = ({ comment, user, currentUser, postId, onDelete }) => {
  const [newReply, setNewReply] = useState('');
  const [replies, setReplies] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [commentLikesCount, setCommentLikesCount] = useState(0);
  const [userLikedComment, setUserLikedComment] = useState(false);
  const [replyLikesCount, setReplyLikesCount] = useState({});
  const [userLikedReplies, setUserLikedReplies] = useState({});
  const [showReplies, setShowReplies] = useState(false);
  const [repliesToShow, setRepliesToShow] = useState(5);
  const [showReplyBox, setShowReplyBox] = useState(false);

  // Fetch replies and likes count for comment and replies
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Replies
        const repliesSnapshot = await getDocs(collection(db, 'content-posts', postId, 'comments', comment.id, 'replies'));
        const replyData = await Promise.all(
          repliesSnapshot.docs.map(async (docSnap) => {
            const reply = { id: docSnap.id, ...docSnap.data() };

            // Likes for each reply
            const likesSnap = await getDocs(collection(db, 'content-posts', postId, 'comments', comment.id, 'replies', docSnap.id, 'likes'));
            const liked = likesSnap.docs.some(likeDoc => likeDoc.id === currentUser.uid);

            return {
              ...reply,
              timestamp: reply.timestamp?.toDate() || null,
              likesCount: likesSnap.size,
              likedByUser: liked
            };
          })
        );

        setReplies(replyData);
        setReplyLikesCount(Object.fromEntries(replyData.map(r => [r.id, r.likesCount])));
        setUserLikedReplies(Object.fromEntries(replyData.map(r => [r.id, r.likedByUser])));

        // Comment Likes
        const commentLikesSnap = await getDocs(collection(db, 'content-posts', postId, 'comments', comment.id, 'likes'));
        setCommentLikesCount(commentLikesSnap.size);
        setUserLikedComment(commentLikesSnap.docs.some(likeDoc => likeDoc.id === currentUser.uid));
      } catch (err) {
        console.error('Error loading comment data:', err);
      }
    };

    fetchData();
  }, [comment.id, postId, currentUser.uid]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userSnap.exists()) return;

    const replyData = {
      userId: currentUser.uid,
      text: newReply,
      timestamp: serverTimestamp()
      // Note: We no longer include displayName or profilePicUrl.
    };

    const replyRef = await addDoc(collection(db, 'content-posts', postId, 'comments', comment.id, 'replies'), replyData);
    setReplies(prev => [
      ...prev,
      { ...replyData, id: replyRef.id, timestamp: new Date(), likesCount: 0, likedByUser: false }
    ]);
    setNewReply('');
    setShowReplyBox(false);
  };

  const handleDeleteComment = async () => {
    if (currentUser.uid !== comment.userId) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'content-posts', postId, 'comments', comment.id));
    onDelete(comment.id);
    setDeleting(false);
  };

  const handleDeleteReply = async (replyId) => {
    await deleteDoc(doc(db, 'content-posts', postId, 'comments', comment.id, 'replies', replyId));
    setReplies(prev => prev.filter(r => r.id !== replyId));
  };

  const toggleLikeComment = async () => {
    const ref = doc(db, 'content-posts', postId, 'comments', comment.id, 'likes', currentUser.uid);
    if (userLikedComment) {
      await deleteFirestoreDoc(ref);
      setCommentLikesCount(prev => prev - 1);
    } else {
      await setDoc(ref, { timestamp: serverTimestamp() });
      setCommentLikesCount(prev => prev + 1);
    }
    setUserLikedComment(prev => !prev);
  };

  const toggleLikeReply = async (replyId) => {
    const ref = doc(db, 'content-posts', postId, 'comments', comment.id, 'replies', replyId, 'likes', currentUser.uid);
    const liked = userLikedReplies[replyId];

    if (liked) {
      await deleteFirestoreDoc(ref);
      setReplyLikesCount(prev => ({ ...prev, [replyId]: prev[replyId] - 1 }));
    } else {
      await setDoc(ref, { timestamp: serverTimestamp() });
      setReplyLikesCount(prev => ({ ...prev, [replyId]: prev[replyId] + 1 }));
    }
    setUserLikedReplies(prev => ({ ...prev, [replyId]: !liked }));
  };

  return (
    <div className={styles['comment-container']}>
      {/* Comment Header */}
      <div className={styles['comment-header']}>
        <Link to={`/profile/${comment.userId}`}>
          <img src={user?.profilePicUrl || dummyPic} alt="avatar" width="30" height="30" />
        </Link>
        <Link to={`/profile/${comment.userId}`}>
          <strong>{user?.displayName || 'Unknown User'}</strong>
        </Link>
      </div>

      <p>{comment.text}</p>
      <p>
        <small>
          {comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleString() : 'No timestamp'}
        </small>
      </p>

      <div className={styles.likeRow}>
        <span>Likes: {commentLikesCount}</span>
        <span className={styles.emojiButton} onClick={toggleLikeComment}>
          {userLikedComment ? '👎' : '👍'}
        </span>
      </div>

      {currentUser.uid === comment.userId && (
        <button className={styles['delete-button']} onClick={handleDeleteComment} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      )}

      {currentUser.uid !== comment.userId && (
        <div style={{ textAlign: 'right', marginBottom: 10 }}>
          <ReportButton
            contentUrl={`${window.location.href}#comment-${comment.id}`}
            profileUrl={`/profile/${comment.userId}`}
            userId={comment.userId}
            iconOnly
          />
        </div>
      )}

      <div className={styles.replyActions}>
        <button className={styles.smallButton} onClick={() => setShowReplyBox(prev => !prev)}>
          {showReplyBox ? 'Cancel' : 'Reply'}
        </button>
        {replies.length > 0 && (
          <button className={styles.smallButton} onClick={() => setShowReplies(prev => !prev)}>
            {showReplies ? 'Hide Replies' : 'View Replies'}
          </button>
        )}
      </div>

      {showReplies && (
        <div className={styles.repliesContainer}>
          {replies.slice(0, repliesToShow).map(reply => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              toggleLikeReply={toggleLikeReply}
              userLikedReplies={userLikedReplies}
              replyLikesCount={replyLikesCount}
              currentUser={currentUser}
              handleDeleteReply={handleDeleteReply}
            />
          ))}
          {replies.length > repliesToShow && (
            <button onClick={() => setRepliesToShow(prev => prev + 5)} className={styles.smallButton}>
              Load More Replies
            </button>
          )}
        </div>
      )}

      {showReplyBox && (
        <form onSubmit={handleReplySubmit} className={styles['reply-form']}>
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Add a reply..."
            required
          />
          <button type="submit" className={styles['post-reply-button']}>
            Post Reply
          </button>
        </form>
      )}
    </div>
  );
};

export default Comment;
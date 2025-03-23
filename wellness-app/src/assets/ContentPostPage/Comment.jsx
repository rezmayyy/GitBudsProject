import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteDoc,
  doc,
  addDoc,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../Firebase';


const Comment = ({ comment, user, currentUser, postId, onDelete }) => {
  const [newReply, setNewReply] = useState('');
  const [replies, setReplies] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [commentLikes, setCommentLikes] = useState(comment.likes || 0);
  const [replyLikes, setReplyLikes] = useState({});
  const [userLikedComment, setUserLikedComment] = useState(comment.likedBy?.includes(currentUser.uid) || false);
  const [userLikedReplies, setUserLikedReplies] = useState({});
  const [showReplies, setShowReplies] = useState(false); // New state to toggle replies visibility
  const [repliesToShow, setRepliesToShow] = useState(5); // Track number of replies to show
  const [showReplyBox, setShowReplyBox] = useState(false); // Track visibility of the reply text box
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Fetch replies when the component mounts
  useEffect(() => {
    const fetchReplies = async () => {
      try {
        const repliesSnapshot = await getDocs(
          collection(db, 'content-posts', postId, 'comments', comment.id, 'replies')
        );
        const repliesList = repliesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            likes: data.likes || 0,
            likedBy: data.likedBy || [],
            timestamp: data.timestamp ? data.timestamp.toDate() : null,
          };
        });

        setReplies(repliesList);
        setReplyLikes(repliesList.reduce((acc, reply) => ({ ...acc, [reply.id]: reply.likes }), {}));
        setUserLikedReplies(
          repliesList.reduce((acc, reply) => ({ ...acc, [reply.id]: reply.likedBy.includes(currentUser.uid) }), {})
        );
      } catch (error) {
        console.error('Error fetching replies:', error);
      }
    };

    fetchReplies();
  }, [comment.id, postId, currentUser.uid]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (newReply.trim()) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnapshot = await getDoc(userDocRef);

        if (!userSnapshot.exists()) {
          console.error('User data not found in Firestore!');
          return;
        }

        const userData = userSnapshot.data();

        const localTimestamp = new Date();
        const replyData = {
          userId: currentUser.uid,
          text: newReply,
          timestamp: serverTimestamp(),
          displayName: currentUser.displayName || 'Anonymous',
          profilePicUrl: userData.profilePicUrl || 'default-profile-pic-url',
          likes: 0,
          likedBy: [],
        };

        const replyRef = await addDoc(
          collection(db, 'content-posts', postId, 'comments', comment.id, 'replies'),
          replyData
        );

        setReplies([...replies, { ...replyData, id: replyRef.id, timestamp: localTimestamp }]);
        setNewReply('');
        setShowReplyBox(false); // Hide the reply box after submitting the reply
      } catch (error) {
        console.error('Error adding reply:', error);
      }
    }
  };

  const handleDeleteComment = async () => {
    if (currentUser.uid === comment.userId) {
      setDeleting(true);
      try {
        await deleteDoc(doc(db, 'content-posts', postId, 'comments', comment.id));
        onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await deleteDoc(doc(db, 'content-posts', postId, 'comments', comment.id, 'replies', replyId));
      setReplies(replies.filter(reply => reply.id !== replyId));
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const toggleLikeComment = async () => {
    const commentRef = doc(db, 'content-posts', postId, 'comments', comment.id);

    try {
      const updateData = userLikedComment
        ? {
          likes: commentLikes - 1,
          likedBy: arrayRemove(currentUser.uid),
        }
        : {
          likes: commentLikes + 1,
          likedBy: arrayUnion(currentUser.uid),
        };

      await updateDoc(commentRef, updateData);
      setCommentLikes(commentLikes + (userLikedComment ? -1 : 1));
      setUserLikedComment(!userLikedComment);
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
    }
  };

  const toggleLikeReply = async (replyId, currentLikes) => {
    const replyRef = doc(db, 'content-posts', postId, 'comments', comment.id, 'replies', replyId);

    try {
      const updateData = userLikedReplies[replyId]
        ? {
          likes: currentLikes - 1,
          likedBy: arrayRemove(currentUser.uid),
        }
        : {
          likes: currentLikes + 1,
          likedBy: arrayUnion(currentUser.uid),
        };

      await updateDoc(replyRef, updateData);
      setReplyLikes(prev => ({ ...prev, [replyId]: currentLikes + (userLikedReplies[replyId] ? -1 : 1) }));
      setUserLikedReplies(prev => ({ ...prev, [replyId]: !prev[replyId] }));
    } catch (error) {
      console.error('Error liking/unliking reply:', error);
    }
  };

  const toggleReplies = () => {
    setShowReplies(prevState => !prevState);
  };

  const loadMoreReplies = () => {
    setRepliesToShow(prev => prev + 5); // Load 5 more replies
  };

  const toggleReplyBox = () => {
    setShowReplyBox(prevState => !prevState); // Toggle the reply box visibility
  };

  return (
    <div className="comment-container">
      {/* Comment Section */}
      <div className="comment-header">
        <Link to={`/profile/${comment.userId}`}>
          <img
            src={user?.profilePicUrl || 'default-profile-pic-url'}
            alt={`${user?.displayName || 'User'}'s profile`}
            width="30"
            height="30"
          />
        </Link>
        <Link to={`/profile/${comment.userId}`}>
          <strong>{user?.displayName || 'Unknown User'}</strong>
        </Link>
      </div>
      <p>{comment.text}</p>
      <p>
        <small>
          {comment.timestamp
            ? (comment.timestamp.seconds
              ? new Date(comment.timestamp.seconds * 1000)
              : new Date(comment.timestamp)
            ).toLocaleString()
            : 'No timestamp'}
        </small>
      </p>
      <p>
        <small>Likes: {commentLikes}</small>
        <button onClick={toggleLikeComment}>{userLikedComment ? '👎 Unlike' : '👍 Like'}</button>
      </p>
      {currentUser.uid === comment.userId && (
        <button onClick={handleDeleteComment} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      )}

      {/* Replies Section */}
      {replies.length > 0 && (
        <button onClick={toggleReplies}>{showReplies ? 'Hide Replies' : 'View Replies'}</button>
      )}
      {showReplies && (
        <div style={{ marginLeft: '20px' }}>
          {replies.slice(0, repliesToShow).map(reply => (
            <div key={reply.id} className="reply-container">
              <div className="reply-header">
                <Link to={`/profile/${reply.userId}`}>
                  <img
                    src={reply?.profilePicUrl || 'default-profile-pic-url'}
                    alt={`${reply?.displayName || 'User'}'s profile`}
                    width="25"
                    height="25"
                  />
                </Link>
                <Link to={`/profile/${reply.userId}`}>
                  <strong>{reply?.displayName || 'Anonymous'}</strong>
                </Link>
              </div>
              <p>{reply.text}</p>
              <p>
                <small>
                  {reply.timestamp
                    ? (reply.timestamp.seconds
                      ? new Date(reply.timestamp.seconds * 1000)
                      : new Date(reply.timestamp)
                    ).toLocaleString()
                    : 'No timestamp'}
                </small>
              </p>
              <p>
                <small>Likes: {replyLikes[reply.id] || reply.likes || 0}</small>
                <button onClick={() => toggleLikeReply(reply.id, replyLikes[reply.id] || reply.likes || 0)}>
                  {userLikedReplies[reply.id] ? '👎 Unlike' : '👍 Like'}
                </button>
              </p>
              {currentUser.uid === reply.userId && (
                <button onClick={() => handleDeleteReply(reply.id)}>Delete</button>
              )}
            </div>
          ))}
          {replies.length > repliesToShow && (
            <button onClick={loadMoreReplies}>Load More Replies</button>
          )}
        </div>
      )}

      {/* Reply Button */}
      <button onClick={toggleReplyBox}>
        {showReplyBox ? "Cancel" : "Reply"}
      </button>

      {/* Reply Form */}
      {showReplyBox && (
        <form onSubmit={handleReplySubmit} className="comment-form">
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Add a reply..."
            required
          />
          <button type="submit" className="reply-button">Post Reply</button>
        </form>
      )}
    </div>
  );
};

export default Comment;

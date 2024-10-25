import React, { useState, useContext } from 'react';
import UserContext from './UserContext'; 
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './Firebase'; 
import { FaHeart } from 'react-icons/fa';

const PostItem = ({ post, preview }) => { 
  const { user } = useContext(UserContext);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likes, setLikes] = useState(post.likes || 0);
  const [likedByUser, setLikedByUser] = useState(post.likedByUser || false);
  const [replies, setReplies] = useState(post.replies || []); 

  // Toggle like for the main post
  const toggleLike = async () => {
    const newLikes = likedByUser ? likes - 1 : likes + 1;
    setLikes(newLikes);
    setLikedByUser(!likedByUser);

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        likes: newLikes,
        likedByUser: !likedByUser,
      });
    } catch (error) {
      console.error('Error liking post: ', error);
    }
  };

  // Reply submission
  const handleReplySubmit = async () => {
    if (replyText.trim()) {
      try {
        const newReply = {
          id: Date.now(),  
          message: replyText,
          timestamp: Date.now(),
          userName: user?.displayName || 'Anonymous',
          likes: 0, 
          likedByUser: false,
        };

        const updatedReplies = [...replies, newReply]; 

        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
          replies: updatedReplies, 
        });

        setReplies(updatedReplies); 
        setReplyText(''); 
        setShowReplyForm(false);
      } catch (error) {
        console.error('Error submitting reply: ', error);
      }
    }
  };

  // Toggle like for a specific reply
  const toggleReplyLike = async (replyId) => {
    const updatedReplies = replies.map((reply) => {
      if (reply.id === replyId) {
        const newLikes = reply.likedByUser ? reply.likes - 1 : reply.likes + 1;
        return {
          ...reply,
          likes: newLikes,
          likedByUser: !reply.likedByUser,
        };
      }
      return reply;
    });

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, { replies: updatedReplies }); 

      setReplies(updatedReplies); 
    } catch (error) {
      console.error('Error liking reply: ', error);
    }
  };

  // Formatting the timestamp
  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); 
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="post-item">
      <div className="post-header">
        <p><strong>{post.userName || 'Anonymous'}</strong></p>
        <span>{formatDate(post.timestamp)}</span>
      </div>
      <p>{post.message}</p>

      <div className="post-actions">
        <FaHeart
          className={`heart-icon ${likedByUser ? 'liked' : ''}`}
          onClick={toggleLike}
        />
        <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
        <span>{replies.length || 0} {replies.length === 1 ? 'Reply' : 'Replies'}</span>
      </div>

      {/* Displaying replies */}
      {replies.length > 0 && (
        <div className="replies-list">
          {replies.map((reply) => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <p><strong>{reply.userName || 'Anonymous'}</strong></p>
                <span>{formatDate(reply.timestamp)}</span>
              </div>
              <p>{reply.message}</p>

              {/* Like button for each reply */}
              <div className="reply-actions">
                <FaHeart
                  className={`heart-icon ${reply.likedByUser ? 'liked' : ''}`}
                  onClick={() => toggleReplyLike(reply.id)} 
                />
                <span>{reply.likes || 0} {reply.likes === 1 ? 'Like' : 'Likes'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form for the main post */}
      {!preview && (
        <>
          <button onClick={() => setShowReplyForm(!showReplyForm)}>
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>

          {showReplyForm && (
            <div className="reply-form">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
              />
              <button onClick={handleReplySubmit}>Submit Reply</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostItem;

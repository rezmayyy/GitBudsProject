import React, { useState, useContext, useEffect } from 'react';
import UserContext from './UserContext'; 
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from './Firebase'; 
import { FaHeart } from 'react-icons/fa';
import dummyPic from './dummyPic.jpeg';

const PostItem = ({ post, preview }) => { 
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likes, setLikes] = useState(post.likes || 0);
  const [likedByUser, setLikedByUser] = useState(post.likers?.includes(user?.uid));
  const [replies, setReplies] = useState(post.replies || []); 
  const [profilePicUrl, setProfilePicUrl] = useState(post.profilePicUrl || dummyPic);

  useEffect(() => {
    const fetchUserProfilePic = async () => {
      if (!post.profilePicUrl && post.userId) {
        const userDoc = await getDoc(doc(db, 'users', post.userId));
        if (userDoc.exists() && userDoc.data().profilePicUrl) {
          setProfilePicUrl(userDoc.data().profilePicUrl);
        } else {
          setProfilePicUrl(dummyPic);
        }
      }
    };
    fetchUserProfilePic();
  }, [post.profilePicUrl, post.userId]);

  const goToUserProfile = (clickedUserId) => {
  if (user && clickedUserId === user.uid) {
    navigate(`/profile/${user.uid}`);
  } else {
    navigate(`/publicprofile/${clickedUserId}`);
  }
};

  
  // Toggle like for the main post
  const toggleLike = async () => {
    if (!user) {
      alert('You need to log in to like this post!');
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    let newLikes;

    if (likedByUser) {
      newLikes = likes - 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likers: arrayRemove(user.uid),
      });
    } else {
      newLikes = likes + 1;
      await updateDoc(postRef, {
        likes: newLikes,
        likers: arrayUnion(user.uid),
      });
    }

    setLikes(newLikes);
    setLikedByUser(!likedByUser);
  };

  const handleReplySubmit = async () => {
    if (replyText.trim()) {
      try {
        let userPicUrl = user?.photoURL;

        // Fetch user's profile picture URL from Firestore if not available
        if (!userPicUrl) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          userPicUrl = userDoc.exists() && userDoc.data().profilePicUrl ? userDoc.data().profilePicUrl : dummyPic;
        }

        const newReply = {
          id: Date.now(),
          message: replyText,
          timestamp: Date.now(),
          userName: user?.displayName || 'Anonymous',
          userId: user?.uid,
          profilePicUrl: userPicUrl,
          likes: 0,
          likers: [],
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
        console.error('Error submitting reply:', error);
      }
    }
  };

  // Toggle Like for a Specific Reply
  const toggleReplyLike = async (replyId) => {
    if (!user) {
      alert('You need to log in to like this reply!');
      return;
    }

    const updatedReplies = replies.map((reply) => {
      if (reply.id === replyId) {
        const isLikedByUser = reply.likers?.includes(user.uid);
        const newLikes = isLikedByUser ? reply.likes - 1 : reply.likes + 1;

        return {
          ...reply,
          likes: newLikes,
          likers: isLikedByUser
            ? reply.likers.filter((uid) => uid !== user.uid)
            : [...(reply.likers || []), user.uid],
        };
      }
      return reply;
    });

    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, { replies: updatedReplies });
    setReplies(updatedReplies);
  };

  // Formatting the timestamp
  const formatDate = (timestamp) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); 
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="post-item">
      <div className="post-header">
        <img
          src={profilePicUrl} 
          alt="Profile"
          className="profile-pic"
          onClick={() => goToUserProfile(post.userId)}
          style={{
            cursor: 'pointer',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            marginRight: '10px',
          }}
          onError={(e) => { e.target.src = dummyPic; }}
        />
        <p onClick={() => goToUserProfile(post.userId)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          {post.userName || 'Anonymous'}
        </p>
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

      {replies.length > 0 && (
        <div className="replies-list">
          {replies.map((reply) => (
            <div key={reply.id} className="reply-item">
              <div className="reply-header">
                <img
                  src={reply.profilePicUrl || dummyPic}
                  alt="Reply Profile"
                  className="reply-profile-pic"
                  onClick={() => goToUserProfile(reply.userId)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    marginRight: '10px',
                  }}
                  onError={(e) => { e.target.src = dummyPic; }}
                />
                <p onClick={() => goToUserProfile(reply.userId)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  {reply.userName || 'Anonymous'}
                </p>
                <span>{formatDate(reply.timestamp)}</span>
              </div>
              <p>{reply.message}</p>

              <div className="reply-actions">
                <FaHeart
                  className={`heart-icon ${reply.likers?.includes(user?.uid) ? 'liked' : ''}`}
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
          <div style={{paddingTop: '10px'}}>
            <button onClick={() => setShowReplyForm(!showReplyForm)}>
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
          </div>
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

// PostItem.jsx
import React, { useState, useContext, useEffect } from 'react';
import UserContext from '../UserContext';
import {
  doc, deleteDoc, setDoc, onSnapshot, collection,
  addDoc, serverTimestamp, getDoc, updateDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../Firebase';
import { FaHeart } from 'react-icons/fa';
import ReportButton from '../ReportButton/Report';
import dummyPic from '../dummyPic.jpeg';
import { getUserById } from '../../Utils/firebaseUtils';

const formatDate = ts => {
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
};

const PostItem = ({ post, preview, onExpand = () => { }, expanded }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [postAuthor, setPostAuthor] = useState(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [postLikes, setPostLikes] = useState(0);
  const [likedByUser, setLikedByUser] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const isMod = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAuthor(true);
      if (post.userId !== '[Removed]') {
        const userData = await getUserById(post.userId);
        if (mounted) setPostAuthor(userData);
      }
      setLoadingAuthor(false);
    })();
    return () => { mounted = false; };
  }, [post.userId]);

  useEffect(() => {
    const likesRef = collection(db, 'posts', post.id, 'likes');
    const unsubscribe = onSnapshot(likesRef, snapshot => {
      setPostLikes(snapshot.size);
      setLikedByUser(snapshot.docs.some(doc => doc.id === user?.uid));
    });
    return unsubscribe;
  }, [post.id, user]);

  useEffect(() => {
    const repliesRef = collection(db, 'posts', post.id, 'replies');
    const unsubscribe = onSnapshot(repliesRef, snapshot => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [post.id]);

  const goToUserProfile = () => {
    if (postAuthor) navigate(`/profile/${postAuthor.displayName}`);
  };

  const toggleLike = async e => {
    e.stopPropagation();
    if (!user) return alert('Log in to like!');
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    likedByUser ? await deleteDoc(likeRef) : await setDoc(likeRef, { timestamp: serverTimestamp() });
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !user) return alert('Log in to reply!');
    await addDoc(collection(db, 'posts', post.id, 'replies'), {
      message: replyText,
      userId: user.uid,
      timestamp: serverTimestamp(),
    });
    setReplyText('');
    setShowReplyForm(false);
  };

  const toggleReplyLike = async replyId => {
    if (!user) return alert('Log in to like reply!');
    const likeRef = doc(db, 'posts', post.id, 'replies', replyId, 'likes', user.uid);
    const likeDoc = await getDoc(likeRef);
    likeDoc.exists() ? await deleteDoc(likeRef) : await setDoc(likeRef, { timestamp: serverTimestamp() });
  };

  const handleRemovePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    if (post.userId === '[Removed]') return;

    try {
      await setDoc(doc(db, 'users', post.userId, 'punishments', `post-${post.id}`), {
        Reason: 'Removed message',
        Message: post.message,
        timestamp: serverTimestamp()
      });

      await deleteDoc(doc(db, 'posts', post.id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loadingAuthor && post.userId !== '[Removed]') return <div className="post-item">Loading…</div>;

  return (
    <div className="post-item" onClick={() => onExpand()} style={{ cursor: 'pointer', borderBottom: '1px solid #ddd', padding: '10px' }}>
      <div className="post-header" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={post.userId === '[Removed]' ? dummyPic : (postAuthor?.profilePicUrl || dummyPic)}
          alt="Profile"
          onClick={e => { e.stopPropagation(); if (post.userId !== '[Removed]') goToUserProfile(); }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px', cursor: 'pointer' }}
          onError={e => e.target.src = dummyPic}
        />
        <p onClick={e => { e.stopPropagation(); if (post.userId !== '[Removed]') goToUserProfile(); }} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          {post.userId === '[Removed]' ? '[Removed]' : postAuthor?.displayName}
        </p>
        <span style={{ marginLeft: 'auto' }}>{formatDate(post.timestamp)}</span>
      </div>

      <p>{expanded ? post.message : `${post.message.slice(0, 100)}${post.message.length > 100 ? '…' : ''}`}</p>

      <div className="post-actions">
        <FaHeart className={`heart-icon ${likedByUser ? 'liked' : ''}`} onClick={toggleLike} />
        <span>{postLikes} {postLikes === 1 ? 'Like' : 'Likes'}</span>
        <span>{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</span>
        {expanded && user?.uid !== post.userId && post.userId !== '[Removed]' && (
          <ReportButton contentUrl={`${window.location.href}#post-${post.id}`} profileUrl={`/profile/${postAuthor?.displayName}`} userId={post.userId} iconOnly />
        )}
        {expanded && isMod && post.userId !== '[Removed]' && (
          <button onClick={(e) => { e.stopPropagation(); handleRemovePost(); }} title="Remove Post" style={{ marginLeft: '10px' }}>
            Remove
          </button>
        )}
      </div>

      {expanded && (
        <div className="replies-section">
          {replies.map(reply => (
            <ReplyItem key={reply.id} reply={reply} postId={post.id} toggleReplyLike={toggleReplyLike} isMod={isMod} />
          ))}
          <div className="reply-form">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write your reply…" />
            <button onClick={handleReplySubmit}>Submit Reply</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReplyItem = ({ reply, postId, toggleReplyLike, isMod }) => {
  const [author, setAuthor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (reply.userId !== '[Removed]') {
        const userData = await getUserById(reply.userId);
        if (mounted) setAuthor(userData);
      }
    })();
    return () => { mounted = false; };
  }, [reply.userId]);

  const handleRemoveReply = async () => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    if (reply.userId === '[Removed]') return;

    try {
      await setDoc(doc(db, 'users', reply.userId, 'punishments', `reply-${reply.id}`), {
        Reason: 'Removed message',
        Message: reply.message,
        timestamp: serverTimestamp()
      });

      await deleteDoc(doc(db, 'posts', postId, 'replies', reply.id));
    } catch (err) {
      console.error('Error deleting reply:', err);
    }
  };

  return (
    <div className="reply-item">
      <div className="reply-header" style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={reply.userId === '[Removed]' ? dummyPic : (author?.profilePicUrl || dummyPic)}
          alt="Reply Profile"
          onClick={() => reply.userId !== '[Removed]' && navigate(`/profile/${author?.displayName}`)}
          style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px', cursor: 'pointer' }}
          onError={e => e.target.src = dummyPic}
        />
        <p onClick={() => reply.userId !== '[Removed]' && navigate(`/profile/${author?.displayName}`)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          {reply.userId === '[Removed]' ? '[Removed]' : author?.displayName}
        </p>
        <span style={{ marginLeft: 'auto' }}>{formatDate(reply.timestamp)}</span>
      </div>
      <p>{reply.message}</p>
      <div className="reply-actions">
        <FaHeart className="heart-icon" onClick={() => toggleReplyLike(reply.id)} />
        {isMod && reply.userId !== '[Removed]' && (
          <button onClick={handleRemoveReply} title="Remove Reply" style={{ marginLeft: '10px' }}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default PostItem;

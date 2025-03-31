// YourFollows.jsx
import React, { useEffect, useState, useContext } from 'react';
import { db } from './Firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import UserContext from './UserContext';
import { useNavigate } from 'react-router-dom';
import dummyPic from './dummyPic.jpeg';

const YourFollows = () => {
  const { user } = useContext(UserContext);
  const [follows, setFollows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollows = async () => {
      if (!user) return;

      try {
        const followsRef = collection(db, `users/${user.uid}/subscriptions`);
        const snapshot = await getDocs(followsRef);

        const followsList = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const followedUserId = docSnap.id;
            const followedUserRef = doc(db, 'users', followedUserId);
            const followedUserSnap = await getDoc(followedUserRef);
            const data = followedUserSnap.data();

            return {
              id: followedUserId,
              displayName: data?.displayName || followedUserId,
              profilePicUrl: data?.profilePicUrl || dummyPic,
            };
          })
        );

        setFollows(followsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching followed users:', error);
        setLoading(false);
      }
    };

    fetchFollows();
  }, [user]);

  const handleUnfollow = async (followedUserId) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, followedUserId));
      await deleteDoc(doc(db, `users/${followedUserId}/subscribers`, user.uid));
      setFollows(prev => prev.filter(f => f.id !== followedUserId));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  if (loading) return <p>Loading your follows...</p>;

  return (
    <div>
      {follows.length === 0 ? (
        <p>You are not following anyone yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {follows.map((follow) => (
            <li key={follow.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #ddd'
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/profile/${follow.displayName}`)}
              >
                <img
                  src={follow.profilePicUrl}
                  alt={follow.displayName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <span style={{ fontWeight: '500' }}>{follow.displayName}</span>
              </div>

              <button
                onClick={() => handleUnfollow(follow.id)}
                style={{
                  background: '#c0392b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default YourFollows;

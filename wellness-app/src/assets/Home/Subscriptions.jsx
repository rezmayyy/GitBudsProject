import '../../styles//Subscriptions.css';

import React, { useEffect, useState, useContext } from 'react';
import { db } from '../Firebase';
import { collection, doc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import UserContext from '../UserContext';
import dummyPic from '../dummyPic.jpeg';

function Subscriptions() {
  const { user } = useContext(UserContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        collection(db, `users/${user.uid}/subscriptions`),
        async (snapshot) => {
          const subsPromises = snapshot.docs.map(async (subDoc) => {
            const subId = subDoc.id; // The subscribed user's ID
            const userRef = doc(db, 'users', subId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              return {
                id: subId,
                displayName: userData.displayName,
                profilePicUrl: userData.profilePicUrl || dummyPic,
              };
            } else {
              return {
                id: subId,
                displayName: subId,
                profilePicUrl: dummyPic,
              };
            }
          });
          const subsData = await Promise.all(subsPromises);
          setSubscriptions(subsData);
        }
      );
      return () => unsubscribe(); 
    }
  }, [user]);

  const removeSubscription = async (id) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/subscriptions`, id));
      console.log(`Subscription removed successfully with id: ${id}`);
    } catch (error) {
      console.error(`Failed to remove subscription with id: ${id}`, error);
    }
  };

  return (
    <div className="subscriptions-container">
      <h4>Your Subscriptions</h4>
      <ul className="subscriptions-list">
        {subscriptions.map((sub) => (
          <li key={sub.id} className="subscription-item">
            <div 
              className="sub-info-wrapper" 
              onClick={() => navigate(`/publicprofile/${sub.id}`)}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <img
                src={sub.profilePicUrl}
                alt={sub.displayName}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: '10px'
                }}
                onError={(e) => { e.target.src = dummyPic; }}
              />
              <span className="sub-info">{sub.displayName}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeSubscription(sub.id);
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Subscriptions;

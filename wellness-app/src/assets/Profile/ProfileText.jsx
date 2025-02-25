import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Text.css';
import UserContext from '../UserContext';

function ProfileText() {
    const [UserText, setUserText] = useState([]);
    const { user } = useContext(UserContext);
   
     // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserText = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'article'), 
                where('author', '==', user.displayName),
                orderBy('timestamp', 'desc'),
            );

            const querySnapshot = await getDocs(q);
            const text = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    url: data.fileURL
                };
            });
            setUserText(text);
        };

        fetchUserText();
    }, []);

    return (
        <div className="userText">
            <div className="text-list">
                {UserText.length > 0 ? (
                    UserText.map(text => (
                        <div key={text.id} className="text-item">
                            <Link to={`/content/${text.id}`}>
                                <h3>{text.title}</h3>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>No text available.</p>
                )}
            </div>
        </div>
    );
}

export default ProfileText;

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './Firebase';
import '../styles/Text.css';

function UserText() {
    const [UserText, setUserText] = useState([]);
    const { username } = useParams(); // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserText = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'text'), 
                where('author', '==', username),
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
                            <h3>{text.title}</h3>
                            <source src={text.url} type="text" />
                        </div>
                    ))
                ) : (
                    <p>No text available.</p>
                )}
            </div>
        </div>
    );
}

export default UserText;

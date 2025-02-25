import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../../styles/Articles.css';
import UserContext from '../UserContext';

function ProfileArticles() {
    const [UserArticles, setUserArticles] = useState([]);
    const { user } = useContext(UserContext); // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserArticles = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'article'), 
                where('author', '==', user.displayName),
                orderBy('timestamp', 'desc'),
            );

            const querySnapshot = await getDocs(q);
            const Articles = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    url: data.fileURL
                };
            });
            setUserArticles(Articles);
        };

        fetchUserArticles();
    }, []);

    return (
        <div className="article">
            <div className="article-list">
                {UserArticles.length > 0 ? (
                    UserArticles.map(Articles => (
                        <div key={Articles.id} className="article-item">
                            <Link to={`/content/${Articles.id}`}>
                                <h3>{Articles.title}</h3>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>No articles available.</p>
                )}
            </div>
        </div>
    );
}

export default ProfileArticles;

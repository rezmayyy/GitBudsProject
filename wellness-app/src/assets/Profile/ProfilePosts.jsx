import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../../styles/Posts.css';
import UserContext from '../UserContext';

function UserPosts() {
    const [UserPosts, setUserPosts] = useState([]);
    const { user } = useContext(UserContext);
    useEffect(() => {
        const fetchUserPosts = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('author', '==', user.displayName),
                orderBy('timestamp', 'desc'),
            );

            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    url: data.fileURL
                };
            });
            setUserPosts(posts);
        };

        fetchUserPosts();
    }, []);

    return (
        <div className="post">
            <div className="post-list">
                {UserPosts.length > 0 ? (
                    UserPosts.map(post => (
                        <div key={post.id} className="post-item">
                            <h3>{post.title}</h3>
                            <source src={post.url}/>
                        </div>
                    ))
                ) : (
                    <p>No posts available.</p>
                )}
            </div>
        </div>
    );
}

export default UserPosts;

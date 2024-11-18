import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './Firebase';
import '../styles/Posts.css';

function UserPosts() {
    const [UserPosts, setUserPosts] = useState([]);
    const { username } = useParams(); // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserPosts = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('author', '==', username),
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
        <div className="userPosts">
            <div className="posts-list">
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

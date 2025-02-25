import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Text.css';
import UserContext from '../UserContext';

function ProfileVideos() {
    const [UserVideos, setUserVideos] = useState([]);
    const { user } = useContext(UserContext); // Get the dynamic username from the URL

    useEffect(() => {
        const fetchUserVideos = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'video'), 
                where('author', '==', user.displayName),
                orderBy('timestamp', 'desc'),
            );

            const querySnapshot = await getDocs(q);
            const videos = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    url: data.fileURL
                };
            });
            setUserVideos(videos);
        };

        fetchUserVideos();
    }, []);

    return (
        <div className="userVideos">
            <div className="video-list">
                {UserVideos.length > 0 ? (
                    UserVideos.map(video => (
                        <div key={video.id} className="video-item">
                            <h3>{video.title}</h3>
                            <video width="320" height="240" controls>
                                <source src={video.url} type="video/mp4" />
                                Your browser does not support the video tag.
                                <p>Video is not available. Please check the URL.</p>
                            </video>
                        </div>
                    ))
                ) : (
                    <p>No videos available.</p>
                )}
            </div>
        </div>
    );
}

export default ProfileVideos;

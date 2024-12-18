import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Videos.css';

function RecentVideos() {
    const [recentVideos, setRecentVideos] = useState([]);

    useEffect(() => {
        const fetchRecentVideos = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'video'), 
                orderBy('timestamp', 'desc'),
                limit(4)
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
            setRecentVideos(videos);
        };

        fetchRecentVideos();
    }, []);

    return (
        <div className="recent-videos">
            <h2>Recent Videos</h2>
            <div className="video-list">
                {recentVideos.length > 0 ? (
                    recentVideos.map(video => (
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
                    <p>No recent videos available.</p>
                )}
            </div>
        </div>
    );
}

export default RecentVideos;

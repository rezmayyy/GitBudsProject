import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Videos.css';

function RecentVideos() {
    const [recentVideos, setRecentVideos] = useState([]);
    const [visibleVideos, setVisibleVideos] = useState(4); 

    useEffect(() => {
        const fetchRecentVideos = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('status', '==', 'approved'), 
                where('type', '==', 'video'),
                orderBy('timestamp', 'desc'),
                limit(10)
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
         <div className="recent-videos-container">
            <h2 className="section-title">🎥 Recent Videos</h2>
            <div className="video-grid">
                {recentVideos.length > 0 ? (
                    recentVideos.slice(0, visibleVideos).map(video => (
                        <div key={video.id} className="video-card">
                            <div className="video-thumbnail">
                                <video controls>
                                    <source src={video.url} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <h3 className="video-title">{video.title}</h3>
                        </div>
                    ))
                ) : (
                    <p className="no-videos">No recent videos available.</p>
                )}
            </div>
            {visibleVideos < recentVideos.length && (
                <button className="load-btn" onClick={() => setVisibleVideos(visibleVideos + 4)}>
                    Load More
                </button>
            )}
        </div>
    );
}

export default RecentVideos;

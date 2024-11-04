import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './Firebase';
import '../styles/GigiVideos.css';

function GigiVideos() {
    const [GigiVideos, setGigiVideos] = useState([]);

    useEffect(() => {
        const fetchGigiVideos = async () => {
            const q = query(
                collection(db, 'content-posts'),
                where('type', '==', 'video'), 
                where('author', '==', 'DrGigi@SerendipityInnovation.com'),
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
            setGigiVideos(videos);
        };

        fetchGigiVideos();
    }, []);

    return (
        <div className="gigi-videos">
            <h2>Videos from our CEO</h2>
            <div className="videos-list">
                {GigiVideos.length > 0 ? (
                    GigiVideos.map(video => (
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
                    <p>No videos from our CEO available.</p>
                )}
            </div>
        </div>
    );
}

export default GigiVideos;

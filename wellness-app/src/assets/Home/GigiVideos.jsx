import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Videos.css';

function GigiVideos() {
    const [GigiVideos, setGigiVideos] = useState([]);

    useEffect(() => {
        const fetchCeoVideo = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, "adminSettings", "fileUploads"));
                if (settingsDoc.exists()) {
                    const activeId = settingsDoc.data().activeVideo; // adjust key name
                    if (activeId) {
                        const videoDoc = await getDoc(doc(db, "adminSettings/fileUploads/CeoVideos", activeId));
                        if (videoDoc.exists()) {
                            const videoData = videoDoc.data();
                            setGigiVideos([{
                                id: activeId,
                                title: videoData.title || "CEO Video",
                                url: videoData.url || videoData.fileURL || ""
                            }]);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch CEO video:", err);
            }
        };

        fetchCeoVideo();
    }, []);


    return (
        <div className="gigiVideos">
            <div className="video-list">
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

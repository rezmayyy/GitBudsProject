import React, { useEffect, useState, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import '../../styles/Videos.css';

function GigiVideos() {
    const [gigiVideos, setGigiVideos] = useState([]);
    const videoOverlayRefs = useRef({});

    useEffect(() => {
        const fetchCeoVideo = async () => {
            try {
                // 1. Grab the adminSettings/fileUploads doc to find the active video ID
                const settingsDoc = await getDoc(doc(db, "adminSettings", "fileUploads"));
                if (settingsDoc.exists()) {
                    const activeId = settingsDoc.data().activeVideo;
                    if (activeId) {
                        // 2. Fetch the actual video document using the active ID
                        const videoDoc = await getDoc(doc(db, "adminSettings", "fileUploads", "CeoVideos", activeId));
                        if (videoDoc.exists()) {
                            const videoData = videoDoc.data();

                            // 3. Construct the full URLs to the video and thumbnail
                            //    (using your bucket name and token).
                            const bucketName = "tribewell-d4492.appspot.com";
                            const downloadToken = "6595d77e-739a-48af-9977-8e693e9e6b24";
                            const videoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(videoData.location)}?alt=media&token=${downloadToken}`;
                            const thumbUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(videoData.thumbnail)}?alt=media&token=${downloadToken}`;

                            // 4. Update state to store the video info
                            setGigiVideos([{
                                id: activeId,
                                title: "CEO Video",
                                videoUrl,
                                thumbUrl
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

    // Hides the overlay image once the video plays
    const handleVideoPlay = (videoId) => {
        if (videoOverlayRefs.current[videoId]) {
            videoOverlayRefs.current[videoId].classList.add('hide-overlay');
        }
    };

    return (
        <div className="gigiVideos">
            <h1>CEO Spotlight</h1>
            <div className="video-list">
                {gigiVideos.length > 0 ? (
                    gigiVideos.map(video => (
                        <div key={video.id} className="video-item">
                            <h3></h3>

                            <div className="video-wrapper">
                                <video
                                    controls
                                    onPlay={() => handleVideoPlay(video.id)}
                                >
                                    <source src={video.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>

                                <img
                                    ref={el => videoOverlayRefs.current[video.id] = el}
                                    src={video.thumbUrl}
                                    alt="Video Thumbnail"
                                    className="video-overlay"
                                />
                            </div>
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

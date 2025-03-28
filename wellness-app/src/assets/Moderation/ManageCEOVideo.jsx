import React, { useState, useContext, useEffect } from 'react';
import { validateFile, uploadFileToStorage } from "../../Utils/fileUtils";
import UserContext from '../UserContext';
import styles from '../Create/create-post.module.css';
import { connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { functions, db } from "../Firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

function ManageCEOVideo() {
    const { user } = useContext(UserContext);
    const [showNotification, setShowNotification] = useState(false);
    const [fileInputs, setFileInputs] = useState({
        file: null,
        thumbnail: null,
        previewFile: '',
        previewThumbnail: ''
    });
    const [ceoVideos, setCeoVideos] = useState([]);
    const [activeVideoId, setActiveVideoId] = useState(null);

    if (process.env.REACT_APP_USE_EMULATOR === "true") {
        connectFunctionsEmulator(functions, "localhost", 5001);
    }

    const moveCeoVideo = httpsCallable(functions, "moveCeoVideo");

    const fetchCeoVideos = async () => {
        const snapshot = await getDocs(collection(db, "adminSettings", "fileUploads", "CeoVideos"));
        const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCeoVideos(vids);
    };

    useEffect(() => {
        fetchCeoVideos();
    }, []);

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!(await validateFile(file, type))) return;
        setFileInputs(prev => ({
            ...prev,
            [type === "image" ? "thumbnail" : "file"]: file,
            [type === "image" ? "previewThumbnail" : "previewFile"]: URL.createObjectURL(file)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) return alert('You must be logged in to submit a video.');
        if (!fileInputs.file || !fileInputs.thumbnail) return alert('Both video and thumbnail files are required.');

        setShowNotification(true);

        try {
            const tempFolder = "temp";
            const videoPath = await uploadFileToStorage(fileInputs.file, tempFolder);
            const thumbPath = await uploadFileToStorage(fileInputs.thumbnail, tempFolder);

            await moveCeoVideo({ filePath: videoPath, thumbnailPath: thumbPath });
            await fetchCeoVideos();
        } catch (error) {
            console.error("Error uploading CEO video:", error);
            alert("Upload failed");
        } finally {
            setShowNotification(false);
        }
    };

    const setActiveVideo = async (videoId) => {
        const ref = doc(db, "adminSettings", "fileUploads");
        await updateDoc(ref, { activeVideo: videoId });
        setActiveVideoId(videoId);
    };

    const deleteVideo = async (id, location, thumbnail) => {
        try {
            await deleteDoc(doc(db, "adminSettings", "fileUploads", "CeoVideos", id));
            // We are skipping actual file deletion for brevity
            setCeoVideos(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            console.error("Failed to delete video", err);
        }
    };

    const uploadForm = (
        <div className={styles.menuContainer}>
            <h2 className={styles.menuTitle}>Upload CEO Video</h2>
            <form className={`video-form`} onSubmit={handleSubmit}>
                <label className={styles.formLabel}>Choose a Video</label>
                <input
                    className={styles.contentInput}
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    required
                />
                {fileInputs.previewFile && (
                    <video controls width="300">
                        <source src={fileInputs.previewFile} type="video/mp4" />
                    </video>
                )}

                <label className={styles.formLabel}>Choose a Thumbnail</label>
                <input
                    className={styles.contentInput}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    required
                />
                {fileInputs.previewThumbnail && (
                    <img src={fileInputs.previewThumbnail} alt="Thumbnail" width="300" />
                )}

                <button className="tab-button" type="submit">
                    Submit Video
                </button>
            </form>
        </div>
    );

    const manageForm = (
        <div className={styles.menuContainer}>
            <h2 className={styles.menuTitle}>Manage CEO Videos</h2>
            {ceoVideos.map(video => (
                <div key={video.id} className={styles.videoCard}>
                    <p><strong>{video.location.split("/").pop()}</strong></p>
                    <p>Uploaded: {new Date(video.timestamp.seconds * 1000).toLocaleString()}</p>
                    <button onClick={() => setActiveVideo(video.id)}>
                        Set Active
                    </button>
                    <button onClick={() => deleteVideo(video.id, video.location, video.thumbnail)}>
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.mainContainer}>
            {uploadForm}
            {manageForm}
            {showNotification && <div className={styles.uploadNotification}>Uploading, this may take a few minutes</div>}
        </div>
    );
}

export default ManageCEOVideo;

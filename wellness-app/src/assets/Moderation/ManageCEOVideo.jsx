import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateFile, uploadFileToStorage } from "../../Utils/fileUtils";
import { useTags } from "../TagSystem/useTags";
import TagSelector from '../TagSystem/TagSelector';
import UserContext from '../UserContext';
import styles from './create-post.module.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from "dompurify";

// Import functions from Firebase Functions SDK
import { connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { functions } from "../Firebase";

function ManageCEOVideo() {
    // IMPORTANT: Change initial state from 'video' to an empty string
    // so that the user is first asked what they're uploading.
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const quillRef = useRef(null);
    const [quillInstance, setQuillInstance] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const tags = useTags();
    const [selectedTags, setSelectedTags] = useState([]);

    const MAX_FILE_SIZES = {
        video: 600 * 1024 * 1024, // 600 MB
    };

    // Notification function
    const showUploadingNotification = () => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 30000);
    };

    // Post data state
    const [postData, setPostData] = useState({
        title: '',
        description: '',
        body: '',
        tags: [] // store all tags
    });

    // File inputs state
    const [fileInputs, setFileInputs] = useState({
        file: null,
        thumbnail: null,
        previewFile: '',
        previewThumbnail: ''
    });

    const handleInputChange = (e) => {
        setPostData({ ...postData, [e.target.name]: e.target.value });
    };

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

    const getKeywords = (title = "", description = "", author = "") => {
        if (!title && !description && !author) return [];

        const tokenize = (text) => text.toLowerCase().match(/\b\w+\b/g) || [];
        const stopWords = new Set([
            "the", "is", "and", "to", "a", "of", "in", "that", "it", "on", "for", "with", "as", "was", "at", "by",
            "an", "be", "this", "which", "or", "from", "but", "not", "are", "were", "can", "will", "has", "had", "have"
        ]);

        const words = [
            ...tokenize(title),
            ...tokenize(description),
            ...tokenize(author)
        ].filter(word => !stopWords.has(word));

        return Array.from(new Set(words));
    };

    // Initialize Firebase Functions and conditionally connect to emulator
    if (process.env.REACT_APP_USE_EMULATOR === "true") {
        connectFunctionsEmulator(functions, "localhost", 5001);
    }
    // Create callable instance for Cloud Function
    const createContentPost = httpsCallable(functions, "createContentPost");

    const minimalModules = {
        toolbar: [
            ['bold', 'italic'],
            ['link'],
            ['clean']
        ]
    };

    // Form submission handler using Cloud Function
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('You must be logged in to submit a post.');
            return;
        }

        if (!fileInputs.file) {
            alert(`Please select a video file.`);
            return;
        }

        if (!postData.tags || postData.tags.length === 0) {
            alert('Please select at least one tag.');
            return;
        }

        // Show upload notification
        showUploadingNotification();

        // Sanitize the content:
        const cleanDescription = true
            ? DOMPurify.sanitize(postData.description)
            : "";

        const keywords = getKeywords(postData.title, postData.description, user.displayName);

        const userId = user.uid;
        const fileFolder = `video-uploads/VideosFromOurCEO`;
        const thumbFolder = `thumbnails/VideosFromOurCEO`;

        const fileURL = fileInputs.file
            ? await uploadFileToStorage(fileInputs.file, fileFolder)
            : null;
        const thumbnailURL = fileInputs.file
            ? await uploadFileToStorage(fileInputs.thumbnail, thumbFolder)
            : null;

        const payload = {
            postData: {
                title: postData.title,
                description: true ? cleanDescription : "",
                body: "",
                type: 'video',
                keywords,
                tags: postData.tags.map(tag => tag.value)
            },
            filePath: fileURL,
            thumbnailPath: thumbnailURL
        };

        try {
            const result = await createContentPost(payload);
            console.log(result.data.message);
            navigate(`/content/${result.data.postId}`);
            setPostData({ title: '', description: '', body: '' });
            setFileInputs({ file: null, thumbnail: null, previewFile: '', previewThumbnail: '' });
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    // Quill image upload handler remains the same
    const handleQuillImageUpload = () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/jpeg, image/png, image/bmp");
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const isValid = await validateFile(file, "image");
                if (!isValid) return;
                const url = await uploadFileToStorage(file, `article-images/${user.uid}`);
                if (!url) {
                    alert("Image upload failed.");
                    return;
                }
                // Append the uploaded image to the appropriate field
                setPostData(prev => ({
                    ...prev,
                    description: prev.description + `<img src="${url}" alt="Uploaded Image"/>`
                }));
            }
        };
    };

    useEffect(() => {
        if (quillInstance) {
            const toolbar = quillInstance.getModule("toolbar");
            if (toolbar) {
                toolbar.addHandler("image", handleQuillImageUpload);
            }
        }
    }, [quillInstance]);

    const renderForm = () => (
        <form className={`video-form`} onSubmit={handleSubmit}>
            <label className={styles.formLabel}>Title</label>
            <input
                className={styles.contentInput}
                type="text"
                name="title"
                value={postData.title}
                onChange={handleInputChange}
                required
            />

            <>
                <div className={styles.descriptionQuillWrapper}>
                    <label className={styles.formLabel}>Description</label>
                    <ReactQuill
                        value={postData.description}
                        onChange={(content) => setPostData(prev => ({ ...prev, description: content }))}
                        modules={minimalModules}
                        theme="snow"
                    />
                </div>
            </>

            <>
                <label className={styles.formLabel}>
                    Choose a Video (Max: {MAX_FILE_SIZES['video'] / 1024 / 1024} MB)
                </label>
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

                <label className={styles.formLabel}>
                    Choose a Thumbnail (optional)
                </label>
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
            </>

            <TagSelector
                selectedTags={postData.tags || []}
                setSelectedTags={(selectedTags) =>
                    setPostData(prevState => ({
                        ...prevState,
                        tags: selectedTags
                    }))
                }
            />

            <button className="tab-button" type="submit">
                Submit Video
            </button>
        </form>
    );

    return (
        <div className={styles.mainContainer}>
            <div className={styles.menuContainer}>
                <h2 className={styles.menuTitle}>Upload Video</h2>

                <div className={styles.formWrapper}>
                    {renderForm()}
                </div>
            </div>
            {showNotification && <div className={styles.uploadNotification}>Uploading, this may take a few minutes</div>}
        </div>
    );
}

export default ManageCEOVideo;

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

function CreatePost() {
    // IMPORTANT: Change initial state from 'video' to an empty string
    // so that the user is first asked what they're uploading.
    const [activeTab, setActiveTab] = useState('');
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const quillRef = useRef(null);
    const [quillInstance, setQuillInstance] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const tags = useTags();
    const [selectedTags, setSelectedTags] = useState([]);


    const MAX_FILE_SIZES = {
        video: 300 * 1024 * 1024, // 300 MB
        audio: 100 * 1024 * 1024, // 100 MB
        image: 10 * 1024 * 1024   // 10 MB
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
        tags: [] //store all tags
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

    // Form submission handler using Cloud Function
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert('You must be logged in to submit a post.');
            return;
        }

        if (!postData.title || (activeTab === 'article' && !postData.body)) {
            alert('Please complete all required fields.');
            return;
        }

        // Skip thumbnail check if it's an article
        if (activeTab !== 'article' && !fileInputs.thumbnail) {
            alert('Please select a thumbnail image.');
            return;
        }

        if (['video', 'audio'].includes(activeTab) && !fileInputs.file) {
            alert(`Please select a ${activeTab} file.`);
            return;
        }


        if (!postData.tags || postData.tags.length === 0) {
            alert('Please select at least one tag.');
            return;
        }

        // Show upload notification
        showUploadingNotification();
        const cleanBody = DOMPurify.sanitize(postData.body);
        const keywords = getKeywords(postData.title, postData.description, user.displayName);

        const userId = user.uid;

        // Build the file paths to include userId subfolders
        const fileFolder = `${activeTab}-uploads/${userId}`;
        const thumbFolder = `thumbnails/${userId}`;

        const fileURL = fileInputs.file
            ? await uploadFileToStorage(fileInputs.file, fileFolder)
            : null;
        const thumbnailURL = activeTab !== 'article'
            ? await uploadFileToStorage(fileInputs.thumbnail, thumbFolder)
            : null;

        // Build the payload for the Cloud Function
        const payload = {
            postData: {
                title: postData.title,
                description: postData.description,
                body: cleanBody,
                type: activeTab,
                keywords,
                tags: postData.tags.map(tag => tag.value) //tags
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

    const modules = {
        toolbar: {
            container: [
                [{ 'header': [3, 4, 5, 6, false] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ],
        }
    };

    // Quill image upload handler
    const handleQuillImageUpload = (quillRef) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/jpeg, image/png, image/bmp");
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];

                const isValid = await validateFile(file, "image");
                if (!isValid) return;

                const imageUrl = await uploadFileToStorage(file, `article-images/${user.uid}`);
                if (!imageUrl) {
                    alert("Image upload failed.");
                    return;
                }

                setPostData((prev) => ({
                    ...prev,
                    body: prev.body + `<img src="${imageUrl}" alt="Uploaded Image"/>`
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
        <form className={`${activeTab}-form`} onSubmit={handleSubmit}>
            <label>Title</label>
            <input type="text" name="title" value={postData.title} onChange={handleInputChange} required />

            {activeTab !== 'article' && (
                <>
                    <label>Choose {activeTab} file (Max: {MAX_FILE_SIZES[activeTab] / 1024 / 1024} MB)</label>
                    <input type="file" accept={`${activeTab}/*`} onChange={(e) => handleFileChange(e, activeTab)} required />
                    {fileInputs.previewFile && (activeTab === 'video' ? (
                        <video controls width="300">
                            <source src={fileInputs.previewFile} type="video/mp4" />
                        </video>
                    ) : (
                        <audio controls>
                            <source src={fileInputs.previewFile} type="audio/mpeg" />
                        </audio>
                    ))}
                </>
            )}

            {activeTab !== 'article' && (
                <>
                    <label>Choose thumbnail image (Max: {MAX_FILE_SIZES.image / 1024 / 1024} MB)</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} required />
                    {fileInputs.previewThumbnail && <img src={fileInputs.previewThumbnail} alt="Thumbnail" width="300" />}
                </>
            )}

            {activeTab === 'article' ? (
                <>
                    <label>Article Body</label>
                    <ReactQuill
                        ref={quillRef}
                        value={postData.body}
                        onChange={(content) => setPostData((prev) => ({ ...prev, body: content }))}
                        modules={modules}
                        theme="snow"
                        onChangeSelection={() => {
                            if (!quillInstance && quillRef.current) {
                                setQuillInstance(quillRef.current.getEditor());
                            }
                        }}
                    />
                </>
            ) : (
                <>
                    <label>Description</label>
                    <textarea name="description" value={postData.description} onChange={handleInputChange}></textarea>
                </>
            )}


            <TagSelector
                selectedTags={postData.tags || []}  // Ensuring tags is an array
                setSelectedTags={(selectedTags) =>
                    setPostData(prevState => ({
                        ...prevState,
                        tags: selectedTags
                    }))
                }
            />

            <button className="tab-button" type="submit">
                Submit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
        </form>
    );

    return (
        <div className={styles.mainContainer}>
            {/* Step 1: Select Post Type */}
            <div className={styles.menuContainer}>
                <h2 className={styles.menuTitle}>What are you uploading?</h2>
                <div className={styles.menuOptions}>
                    {['video', 'audio', 'article'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`${styles.menuOption} ${activeTab === type ? styles.activeOption : ''}`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Show Form Only If a Type Is Chosen */}
            {activeTab && (
                <div className={styles.formWrapper}>
                    <form className={styles.outerForm} onSubmit={handleSubmit}>
                        {/* White Card Container for Fields */}
                        <div className={styles.formContainer}>
                            <label className={styles.formLabel}>Title</label>
                            <input
                                className={styles.contentInput}
                                type="text"
                                name="title"
                                value={postData.title}
                                onChange={handleInputChange}
                                required
                            />

                            {activeTab !== 'article' && (
                                <>
                                    <label className={styles.formLabel}>
                                        Choose {activeTab} file (Max: {MAX_FILE_SIZES[activeTab] / 1024 / 1024} MB)
                                    </label>
                                    <input
                                        className={styles.contentInput}
                                        type="file"
                                        accept={`${activeTab}/*`}
                                        onChange={(e) => handleFileChange(e, activeTab)}
                                        required
                                    />
                                    {fileInputs.previewFile && (activeTab === 'video' ? (
                                        <video controls width="300">
                                            <source src={fileInputs.previewFile} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <audio controls>
                                            <source src={fileInputs.previewFile} type="audio/mpeg" />
                                        </audio>
                                    ))}

                                    <label className={styles.formLabel}>
                                        Choose thumbnail image (Max: {MAX_FILE_SIZES.image / 1024 / 1024} MB)
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
                            )}

                            {activeTab === 'article' ? (
                                <div className={styles.quillWrapper}>
                                    <label className={styles.formLabel}>Article Body</label>
                                    <ReactQuill
                                        ref={quillRef}
                                        className={styles.quillEditor}
                                        value={postData.body}
                                        onChange={(content) => setPostData((prev) => ({ ...prev, body: content }))}
                                        modules={modules}
                                        theme="snow"
                                        onChangeSelection={() => {
                                            if (!quillInstance && quillRef.current) {
                                                setQuillInstance(quillRef.current.getEditor());
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <label className={styles.formLabel}>Description</label>
                                    <textarea
                                        className={styles.contentTextarea}
                                        name="description"
                                        value={postData.description}
                                        onChange={handleInputChange}
                                    />
                                </>
                            )}
                            <TagSelector
                                selectedTags={postData.tags || []}
                                setSelectedTags={(selectedTags) =>
                                    setPostData((prevState) => ({
                                        ...prevState,
                                        tags: selectedTags,
                                    }))
                                }
                            />
                        </div>

                        {/* Separate Container for Submit Button */}
                        <div className={styles.submitContainer}>
                            <button className={styles.submitButton} type="submit">
                                Submit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showNotification && <div className={styles.uploadNotification}>Uploading, this may take a few minutes</div>}
        </div>
    );
}

export default CreatePost;

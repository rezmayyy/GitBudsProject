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
import { httpsCallable } from "firebase/functions";
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

    // Create callable instance for Cloud Function
    const createContentPost = httpsCallable(functions, "createContentPost");

    // Define two toolbar modules:
    const articleModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }, { color: [] }, { background: [] }],
            ['link', 'image', 'code-block'],
            ['clean']
        ]
    };

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

        // For articles, require title and body; for others, require title and description.
        if (!postData.title || (activeTab === 'article' && !postData.body) || (activeTab !== 'article' && !postData.description)) {
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

        // Sanitize the content:
        const cleanBody = activeTab === 'article'
            ? DOMPurify.sanitize(postData.body)
            : "";
        const cleanDescription = activeTab !== 'article'
            ? DOMPurify.sanitize(postData.description)
            : "";

        const keywords = getKeywords(postData.title, activeTab !== 'article' ? postData.description : postData.body, user.displayName);

        const userId = user.uid;
        const tempFolder = `temp/${userId}`;

        const fileURL = fileInputs.file
            ? await uploadFileToStorage(fileInputs.file, tempFolder)
            : null;
        const thumbnailURL = activeTab !== 'article'
            ? await uploadFileToStorage(fileInputs.thumbnail, tempFolder)
            : null;

        const payload = {
            postData: {
                title: postData.title,
                description: activeTab !== 'article' ? cleanDescription : "",
                body: activeTab === 'article' ? cleanBody : "",
                type: activeTab,
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
                if (activeTab === 'article') {
                    setPostData(prev => ({
                        ...prev,
                        body: prev.body + `<img src="${url}" alt="Uploaded Image"/>`
                    }));
                } else {
                    setPostData(prev => ({
                        ...prev,
                        description: prev.description + `<img src="${url}" alt="Uploaded Image"/>`
                    }));
                }
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
            <label className={styles.formLabel}>Title</label>
            <input
                className={styles.contentInput}
                type="text"
                name="title"
                value={postData.title}
                onChange={handleInputChange}
                required
            />

            {activeTab !== 'article' ? (
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
            ) : (
                <div className={styles.quillWrapper}>
                    <label className={styles.formLabel}>Article Body</label>
                    <ReactQuill
                        ref={quillRef}
                        className={styles.quillEditor}
                        value={postData.body}
                        onChange={(content) => setPostData(prev => ({ ...prev, body: content }))}
                        modules={articleModules}
                        theme="snow"
                        onChangeSelection={() => {
                            if (!quillInstance && quillRef.current) {
                                setQuillInstance(quillRef.current.getEditor());
                            }
                        }}
                    />
                </div>
            )}

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
                    {renderForm()}
                </div>
            )}

            {showNotification && <div className={styles.uploadNotification}>Uploading, this may take a few minutes</div>}
        </div>
    );
}

export default CreatePost;

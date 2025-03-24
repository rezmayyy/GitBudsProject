import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {useTags} from "./TagSystem/useTags";
import TagSelector from './TagSystem/TagSelector';
import UserContext from './UserContext';
import '../styles/create-post.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from "dompurify";

// Import functions from Firebase Functions SDK
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

function CreatePost() {
    const [activeTab, setActiveTab] = useState('video'); // Default tab
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const quillRef = useRef(null);
    const [quillInstance, setQuillInstance] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const tags = useTags();
    const [selectedTags, setSelectedTags] = useState([]);


    const MAX_FILE_SIZES = {
        video: 300 * 1024 * 1024, // 300 MB
        audio: 100 * 1024 * 1024,  // 100 MB
        image: 10 * 1024 * 1024    // 10 MB
    };

    // Notification function
    const showUploadingNotification = () => {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 6000);
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

    // File validation function (client-side check remains unchanged)
    const validateFile = async (file, type) => {
        if (!file) return false;

        const allowedExtensions = {
            video: ["mp4"],
            audio: ["mp3", "wav"],
            image: ["jpg", "jpeg", "png", "bmp"]
        };

        const allowedMimeTypes = {
            video: ["video/mp4"],
            audio: ["audio/mpeg", "audio/wav"],
            image: ["image/jpeg", "image/png"]
        };

        const validSignatures = {
            "mp4": [["00", "00", "00"], ["66", "74", "79", "70"]],
            "mp3": [["49", "44", "33"]],
            "wav": [["52", "49", "46", "46"]],
            "jpg": [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
            "jpeg": [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
            "png": [["89", "50", "4e", "47"]]
        };

        // Validate size
        if (file.size > MAX_FILE_SIZES[type]) {
            alert(`File exceeds ${MAX_FILE_SIZES[type] / 1024 / 1024}MB limit.`);
            return false;
        }

        // Validate extension
        const fileExtension = file.name.split(".").pop().toLowerCase();
        if (!allowedExtensions[type].includes(fileExtension)) {
            alert("Invalid file extension.");
            return false;
        }

        // Validate MIME type
        if (!allowedMimeTypes[type].includes(file.type)) {
            alert("Invalid file type.");
            return false;
        }

        // Validate file signature (Magic Bytes)
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const fileSignature = Array.from(uint8Array.slice(0, 12), (byte) => byte.toString(16).padStart(2, "0"));

        const validSigs = validSignatures[fileExtension] || [];
        const isValid = validSigs.some(sig => fileSignature.slice(0, sig.length).join(" ") === sig.join(" "));

        if (!isValid) {
            alert("Invalid file signature. Possible spoofed file.");
            return false;
        }

        return true;
    };

    const handleFileChange = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const isValid = await validateFile(file, type);
        if (!isValid) return;

        setFileInputs((prev) => ({
            ...prev,
            [type === "image" ? "thumbnail" : "file"]: file,
            [type === "image" ? "previewThumbnail" : "previewFile"]: URL.createObjectURL(file)
        }));
    };

    // Updated upload function to include user-specific folder in the file path
    const uploadFileToStorage = async (file, folder) => {
        if (!file) return null;
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `${folder}/${file.name}`);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading file:', error);
            return null;
        }
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
    const functions = getFunctions();
    if (process.env.REACT_APP_USE_EMULATOR === "true") {
        connectFunctionsEmulator(functions, "localhost", 5001);
    }
    // Create callable instance for our new Cloud Function
    const createContentPost = httpsCallable(functions, "createContentPost");

    // Unified form submission handler using Cloud Function for document creation
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


        if(!postData.tags || postData.tags.length === 0){
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

        const fileURL = fileInputs.file ? await uploadFileToStorage(fileInputs.file, fileFolder) : null;
        const thumbnailURL = activeTab !== 'article' ? await uploadFileToStorage(fileInputs.thumbnail, thumbFolder) : null;

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
            filePath: fileURL,         // These should be the storage paths/URLs
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

    // Quill image upload handler remains unchanged
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
        <div>
            <div className="tabs">
                {['video', 'audio', 'article'].map((type) => (
                    <button key={type} onClick={() => setActiveTab(type)} className={`tab-button ${activeTab === type ? 'active' : ''}`}>
                        Post {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            <div className="tab-content">{renderForm()}</div>
            {showNotification && <div className="upload-notification">Uploading...</div>}
        </div>
    );
}

export default CreatePost;

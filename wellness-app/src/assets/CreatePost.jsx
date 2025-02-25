
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './Firebase';
import UserContext from './UserContext';
import '../styles/create-post.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';



function CreatePost() {

    const [activeTab, setActiveTab] = useState('video'); //default tab

    const [videoTitle, setVideoTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoDescription, setVideoDescription] = useState('');
    const [videoPreview, setVideoPreview] = useState('');
    
    const [audioTitle, setAudioTitle] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [audioDescription, setAudioDescription] = useState('');
    const [audioPreview, setAudioPreview] = useState('');

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    const [articleTitle, setArticleTitle] = useState('');
    const [articleBody, setArticleBody] = useState('');


    const MAX_VID_SIZE = 300 * 1024 * 1024; //300 MB
    const MAX_AUD_SIZE = 10 * 1024 * 1024; //10 MB
    const MAX_IMG_SIZE = 10 * 1024 * 1024; //10 MB

    const { user } = useContext(UserContext);
    
    const navigate = useNavigate();


    const handleFileChange = (event, maxSize, type) => {
        const file = event.target.files[0];
        if (file && file.size <= maxSize) { //set file state
            if (event.target.accept.startsWith('video/')) {
                setVideoFile(file);
                setVideoPreview(URL.createObjectURL(file)); //preview
            } else if (event.target.accept.startsWith('audio/')){
                setAudioFile(file);
                setAudioPreview(URL.createObjectURL(file));
            }else if (event.target.accept.startsWith('image/')){
                setThumbnailFile(file);
                setThumbnailPreview(URL.createObjectURL(file)); //preview
            }

        } else {
            alert(`File size exceeds the allowed limit of ${maxSize / 1024 / 1024} MB.`);
        }

    }


    //upload file to firebase
    const uploadFileToStorage = async (file, folder) => {

        if (!file) return null;

        try {
            const storage = getStorage();
            const storageRef = ref(storage, `${folder}/${file.name}`);
            await uploadBytes(storageRef, file); //upload
            return await getDownloadURL(storageRef); //get the url
        }catch(error){
            console.error('Error uploading the file: ', error);
            return null;
        }
        
        
    }



    //submission handling
    const handleVideoSubmit = async (e) => {
        e.preventDefault();

        if(!user){
            alert('Must be logged in to submit a video post')
        }
        
        if (!videoFile) {
            alert('Please select a video file to upload');
            return;
        }

        if (!thumbnailFile) {
            alert('Please select a thumbnail image to upload');
            return;
        }

        const newVideoPost = {
            title: videoTitle,
            description: videoDescription,
            author: user.displayName,
            timestamp: Timestamp.now(),
            status: "pending"
        };

        try {
            //upload file to firebase and get url
            const videoURL = await uploadFileToStorage(videoFile, 'video-uploads');
            const thumbnailURL = await uploadFileToStorage(thumbnailFile, 'thumbnails');
            
            const docRef = await addDoc(collection(db, 'content-posts'), {
                ...newVideoPost,
                fileURL: videoURL,
                thumbnailURL: thumbnailURL,
                type: 'video'
            });
            //alert('Video posted successfully!'); //testing

            //navigate to content page
            navigate(`/content/${docRef.id}`)

            //reset fields
            setVideoTitle('');
            setVideoFile(null);
            setThumbnailFile(null);
            setVideoDescription('');
        } catch (error) {
            console.log('Error adding video post: ', error);
        }
    };

    const handleAudioSubmit = async (e) => {
        e.preventDefault();

        if(!user){
            alert('Must be logged in to submit an audio post')
        }
        
        if (!audioFile) {
            alert('Please select an audio file to upload');
            return;
        }

        if (!thumbnailFile) {
            alert('Please select a thumbnail image to upload');
            return;
        }

        const newAudioPost = {
            title: audioTitle,
            description: audioDescription,
            author: user.displayName,
            timestamp: Timestamp.now(),
            status: "pending"
        };

        try {
            //upload file to firebase and get url
            const audioURL = await uploadFileToStorage(audioFile, 'audio-uploads');
            const thumbnailURL = await uploadFileToStorage(thumbnailFile, 'thumbnails');

            console.log("audio URL:", audioURL);    //testing
            console.log("thumbnail URL:", thumbnailURL);    //testing
            
            const docRef = await addDoc(collection(db, 'content-posts'), {
                ...newAudioPost,
                fileURL: audioURL,
                thumbnailURL: thumbnailURL,
                type: 'audio'
            });
            //alert('Audio posted successfully!');

            //navigate to content page
            navigate(`/content/${docRef.id}`)

            //reset fields
            setAudioTitle('');
            setAudioFile(null);
            setThumbnailFile(null);
            setAudioDescription('');
        } catch (error) {
            console.log('Error adding audio post: ', error);
        }
    }

    const handleArticleSubmit = async (e) => {
        e.preventDefault();
        
        if(!user){
            alert('Must be logged in to submit an article')
        }

        if (!articleTitle) {
            alert('Please enter article title to upload');
            return;
        }
        if (!thumbnailFile) {
            alert('Please select a thumbnail image to upload');
            return;
        }
        if (!articleBody) {
            alert('Please enter article body to upload');
            return;
        }

        const newArticlePost = {
            title: articleTitle,
            body: articleBody,
            author: user.displayName,
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            status: "pending"
        };

        
        try {
            //upload file to firebase and get url
            const thumbnailURL = await uploadFileToStorage(thumbnailFile, 'thumbnails');
            const docRef = await addDoc(collection(db, 'content-posts'), {
                ...newArticlePost,
                thumbnailURL: thumbnailURL,
                type: 'article'
            });
            //alert('Article posted successfully!');

            //navigate to content page
            navigate(`/content/${docRef.id}`)

            //reset fields
            setArticleTitle('');
            setThumbnailFile(null);
            setArticleBody('');
        } catch (error) {
            console.log('Error adding article post: ', error);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [3, 4, 5, 6, false] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    }


    //diplay content based on selected tab
    const renderTabContent = () => {

        //switch between video, audio, and article
        switch (activeTab) {
            case 'video':
                return (
                    <div className="video-content">
                        <h2>Post a Video</h2>
                        <form className="video-form" onSubmit={handleVideoSubmit}>
                            <label>Video title</label>
                            <input className="content-input"
                                type="text"
                                placeholder="Video Title"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                                required />
                            <label>Choose video file <small>(Max file size: {MAX_VID_SIZE / 1024 / 1024} MB</small>)</label>
                            
                            <input className="content-input"
                                type="file"
                                accept="video/*"
                                required
                                onChange={(e) => handleFileChange(e, MAX_VID_SIZE, 'video')}
                            />
                            {/* video file preview */}
                            {videoPreview && (
                                <div className="preview-container">
                                    <video controls width="300">
                                        <source src={videoPreview} type="video/mp4" />
                                        Your browser does not support the video tag
                                    </video>
                                </div>
                            )}
                            <label>Choose thumbnail image (<small>Max file size: {MAX_IMG_SIZE / 1024 / 1024} MB</small>)</label>
                            <input className="content-input"
                                type="file" 
                                accept="image/*" 
                                placeholder="Cover Image" 
                                required
                                onChange={(e) => handleFileChange(e, MAX_IMG_SIZE, 'image', setThumbnailFile)}
                            />
                            {/* thumbnail file preview */}
                            {thumbnailPreview && (
                                <div className="preview-container">
                                    <img src={thumbnailPreview} alt="Thumbnail" width="300" />
                                </div>
                            )}
                            <label>Add post description</label>
                            <textarea className="content-textarea"
                                placeholder="Video Description"
                                value={videoDescription}
                                onChange={(e) => setVideoDescription(e.target.value)}
                            ></textarea>
                            <label>Add post tags</label>
                            <input className="content-input" type="text" placeholder="Tags (comma separated)" />
                            <button className="tab-button" type="submit">Submit Video</button>
                        </form>
                    </div>
                );
            case 'audio':
                return (
                    <div className="audio-content" >
                        <h2>Post an Audio</h2>
                        <form className="audio-form" onSubmit={handleAudioSubmit}>
                            <label>Audio title</label>
                            <input className="content-input"
                                type="text" 
                                placeholder="Audio Title"
                                value={audioTitle} 
                                required
                                onChange={(e) => setAudioTitle(e.target.value)}
                                
                            />
                            <label>Choose audio file (<small>Max file size: {MAX_AUD_SIZE / 1024 / 1024} MB</small>)</label>
                            <input className="content-input"
                                type="file"
                                accept="audio/*"
                                required
                                onChange={(e) => handleFileChange(e, MAX_AUD_SIZE, 'audio', setAudioFile)}
                            />
                            
                            {/* audio file preview */}
                            {audioPreview && (
                                <div className="preview-container">
                                    <audio controls width="300">
                                        <source src={audioPreview} type="audio/mp4" />
                                        Your browser does not support the audio tag
                                    </audio>
                                </div>
                            )}

                            <label>Choose thumbnail image (<small>Max file size: {MAX_IMG_SIZE / 1024 / 1024} MB</small>)</label>
                            <input className="content-input"
                                type="file" 
                                accept="image/*" 
                                placeholder="Cover Image" 
                                required
                                onChange={(e) => handleFileChange(e, MAX_IMG_SIZE, 'image', setThumbnailFile)}
                            />
                            
                            {/* thumbnail file preview */}
                            {thumbnailPreview && (
                                <div className="preview-container">
                                    <img src={thumbnailPreview} alt="Thumbnail" width="300" />
                                </div>
                            )}
                            <label>Add post description</label>
                            <textarea className="content-textarea"
                                placeholder="Audio Description"
                                value={audioDescription} onChange={(e) => setAudioDescription(e.target.value)}
                            ></textarea>
                            <label>Add post tags</label>
                            <input className="content-input" type="text" placeholder="Tags (comma separated)" />
                            <button className="tab-button" type="submit">Submit Audio</button>
                        </form>
                    </div>
                );
            case 'article':
                return (
                    <div className="article-content">
                        <h2>Post an Article</h2>
                        <form className="article-form" onSubmit={handleArticleSubmit}>
                            <label>Article title</label>
                            <input 
                                type="text" 
                                placeholder="Article Title"
                                value={articleTitle} 
                                onChange={(e) => setArticleTitle(e.target.value)}
                                required

                            />
                            <label>Choose thumbnail image (<small>Max file size: {MAX_IMG_SIZE / 1024 / 1024} MB</small>)</label>
                            <input className="content-input"
                                type="file" 
                                accept="image/*" 
                                placeholder="Cover Image" 
                                required
                                onChange={(e) => handleFileChange(e, MAX_IMG_SIZE, 'image', setThumbnailFile)}
                            />
                            {/* thumbnail file preview */}
                            {thumbnailPreview && (
                                <div className="preview-container">
                                    <img src={thumbnailPreview} alt="Thumbnail" width="300" />
                                </div>
                            )}
                            <label>Add article body</label>
                            <ReactQuill
                                value={articleBody}
                                onChange={setArticleBody} //update article body
                                modules={modules}
                                theme="snow"
                                className="quill-textarea"
                            />
                            <label>Add post tags</label>
                            <input type="text" placeholder="Tags (comma separated)" />

                            <button className="tab-button" type="submit">Submit Article</button>
                        </form>
                    </div>
                );
            default:
                return null;

        }


    };





    /* Page Layout */
    return (

        <div>
            <div className="tabs">
                {/* if clicked on video tab, show video post form */}
                <button onClick={() =>
                    setActiveTab('video')
                } className={`tab-button ${activeTab === 'video' ? 'active' : 'video'}`}>
                    Post Video
                </button>

                {/* if clicked on audio tab, show audio post form */}
                <button
                    onClick={() => setActiveTab('audio')
                    } className={`tab-button ${activeTab === 'audio' ? 'active' : 'audio'}`}>
                    Post Audio
                </button>

                {/* if clicked on article tab, show article post form */}
                <button onClick={() =>
                    setActiveTab('article')
                } className={`tab-button ${activeTab === 'article' ? 'active' : 'article'}`}>
                    Post Article
                </button>

            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>


        </div>

    );
}

export default CreatePost;
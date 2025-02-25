import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from './Firebase';
import {format} from "date-fns";
import { getUserIdByDisplayName } from '../Utils/firebaseUtils';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';


const ContentPostPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [editedBody, setEditedBody] = useState("");

    const [likes, setLikes] = useState([]);
    const [dislikes, setDislikes] = useState([]);

    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState("");

    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [uid, setUid] = useState("");



    //error handling
    useEffect(() => {
        const fetchPost = async () => { //fetch from firebase
            const postDoc = doc(db, 'content-posts', postId);
            const postSnapshot = await getDoc(postDoc);
            if (postSnapshot.exists()) {
                const postData = {id: postId, ...postSnapshot.data()};
                setPost(postData);
                setEditedTitle(postData.title || "");
                setEditedDescription(postData.description || "");
                setEditedBody(postData.body || "")
                setLikes(postData.likes || []);
                setDislikes(postData.dislikes || []);
                const id = await getUserIdByDisplayName(postData.author);
                setUid(id);

            } else {
                console.error('No such document!');
            }
            setLoading(false);
        };

        fetchPost();
    }, [postId]); 

    if (loading) {
        return <div>Loading...</div>;
    }
    if(!post){
        return <div>Error loading post</div>
    }

    const isAuthor = currentUser?.displayName === post.author;
    
    

    const handleLike = async () => {

        if(!currentUser){
            setMessage("You need to be logged in to like to a post.")
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000)
            return;
        }

        const postRef = doc(db, "content-posts", post.id);
        
        let updatedLikes = [...likes];
        let updatedDislikes = [...dislikes];

        if(likes.includes(currentUser.uid)){
            updatedLikes = updatedLikes.filter((uid) => uid !== currentUser.uid);
        }
        else{
            updatedLikes.push(currentUser.uid);
            updatedDislikes = updatedDislikes.filter((uid) => uid !== currentUser.uid);
        }

        await updateDoc(postRef, {
            likes: updatedLikes,
            dislikes: updatedDislikes,
        })

        setLikes(updatedLikes);
        setDislikes(updatedDislikes);
    }


    const handleDislike = async () => {

        if(!currentUser){
            setMessage("You need to be logged in to dislike to a post.")
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000)
            return;
        }

        const postRef = doc(db, "content-posts", post.id);
        
        let updatedLikes = [...likes];
        let updatedDislikes = [...dislikes];

        if(dislikes.includes(currentUser.uid)){
            updatedDislikes = updatedDislikes.filter((uid) => uid !== currentUser.uid);
        }
        else{
            updatedDislikes.push(currentUser.uid);
            updatedLikes = updatedLikes.filter((uid) => uid !== currentUser.uid);
        }

        await updateDoc(postRef, {
            likes: updatedLikes,
            dislikes: updatedDislikes,
        })

        setLikes(updatedLikes);
        setDislikes(updatedDislikes);

    }


    const handleEdit = () => {
        if(isAuthor) {
            setIsEditing(true);
        }
    }

    const handleSave = async() => {
        try{
            if(!post) {
                return;
            }
            const postRef = doc(db, "content-posts", post.id);
            const updatedData = {};
            if(editedTitle) updatedData.title = editedTitle;
            if(editedDescription) updatedData.description = editedDescription;
            if(editedBody) updatedData.body = editedBody;
            updatedData.lastUpdated = serverTimestamp();
            
            await updateDoc(postRef, updatedData);

            const updatedPostSnapshot = await getDoc(postRef);
            const updatedPostData = updatedPostSnapshot.data();
            setPost((prev) => ({
                ...prev, 
                ...updatedPostData
            }))
            setIsEditing("");
        } catch(error){
            console.error("Error updating post ", error);
        }
    }
   
    const formattedDate = post.timestamp ? format(post.timestamp.toDate(), "PP p") : "Unknown Date";
    const formattedLastUpdated = post.lastUpdated && post.lastUpdated.toDate ? format(post.lastUpdated.toDate(), "PP p") : "Unknown Date";

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


    return (
        <div className="container d-flex justify-content-center align-items-center" style={{marginTop: '50px', marginBottom: '50px'}}>
            <div className={`card ${post.type}-post`} style={{ maxWidth: '800px', width: '100%'}}>
                
                {/* video posts */}

                {post.type === 'video' && (
                    <div>
                        <div className="card-header">
                            <video className="card-img-top" controls poster={post.thumbnailURL}>
                                <source src={post.fileURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        <div className="card-body">
                            <button className="btn btn-light" onClick={handleLike}>
                                <i className="bi bi-hand-thumbs-up"></i> {likes.length}
                            </button>
                            <button className="btn btn-light ms-2" onClick={handleDislike}>
                                <i className="bi bi-hand-thumbs-down"></i> {dislikes.length}
                            </button>    
                        </div>

                
                        {/* title and description */}
                        <div className="card-body">
                        {isAuthor ? (isEditing === "title" ? (
                                <input 
                                    type="text"
                                    className="form-control mb-2"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)} 
                                    onBlur={handleSave} //stop edititng when clicked away
                                    autoFocus
                                />
                                ) : (
                                    <h5 className="card-title" onDoubleClick={() => setIsEditing("title")}>{post.title}</h5>
                                )) : (
                                    <h5 className="card-title">{post.title}</h5>
                                )}

                            {isAuthor ? (isEditing === "description" ? (
                                <textarea 
                                    type="text"
                                    className="form-control mb-2"
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)} 
                                    onBlur={handleSave}
                                    autoFocus
                                />
                                
                        ) : (
                            <p className="card-text" onDoubleClick={() => setIsEditing("description")}>{post.description}</p>
                        )) : (
                            <p className="card-text">{post.description}</p>
                        )}

                        {isEditing && (
                            <button className="btn btn-success" onClick={handleSave}>
                                Save
                            </button>
                        )}
                        
                        <h6 className="card-subtitle text-muted"> By: <Link to={`/publicprofile/${uid || post.author}`}>{post.author}</Link> | Date: {formattedDate} </h6> {/* will need to add author field to the db */}
                        </div>

                        {/* author section */}
                        <div className="card-footer">
                            <h6>About the Author</h6>
                            <p className="text-muted">Short section about the author.</p>
                        </div>
                    </div>
                )}


                {/* audio posts */}

                {post.type === 'audio' && (
                    <div>
                    {/* thumbnail */}
                    <div className="card-header">
                      <img
                        src={post.thumbnailURL}
                        alt="Audio Thumbnail"
                        className="card-img-top"
                        style={{ height: 'auto' }}
                      />
                    </div>
        
                    {/* audio controls */}
                    <div className="card-body">
                      <audio controls className="w-100">
                        <source src={post.fileURL} type="audio/mpeg" />
                        Your browser does not support the audio tag.
                      </audio>
                      
                    </div>


                    <div className="card-body">
                        <button className="btn btn-light" onClick={handleLike}>
                            <i className="bi bi-hand-thumbs-up"></i> {likes.length}
                        </button>
                        <button className="btn btn-light ms-2" onClick={handleDislike}>
                            <i className="bi bi-hand-thumbs-down"></i> {dislikes.length}
                        </button>    
                    </div>


                    {/* title and description */}
                    <div className="card-body">
                        
                        {isAuthor ? (isEditing === "title" ? (
                                <input 
                                    type="text"
                                    className="form-control mb-2"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)} 
                                    onBlur={handleSave} //stop edititng when clicked away
                                    autoFocus
                                />
                                ) : (
                                    <h5 className="card-title" onDoubleClick={() => setIsEditing("title")}>{post.title}</h5>
                                )) : (
                                    <h5 className="card-title">{post.title}</h5>
                                )}

                            {isAuthor ? (isEditing === "description" ? (
                                <textarea 
                                    type="text"
                                    className="form-control mb-2"
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)} 
                                    onBlur={handleSave}
                                    autoFocus
                                />
                                
                        ) : (
                            <p className="card-text" onDoubleClick={() => setIsEditing("description")}>{post.description}</p>
                        )) : (
                            <p className="card-text">{post.description}</p>
                        )}

                        {isEditing && (
                            <button className="btn btn-success" onClick={handleSave}>
                                Save
                            </button>
                        )}
                        
                        <h6 className="card-subtitle text-muted"> By: <Link to={`/publicprofile/${uid || post.author}`}>{post.author}</Link> | Date: {formattedDate} </h6> {/* will need to add author field to the db */}
                        
                    </div>

                    {/* author section */}
                    <div className="card-footer">
                        <h6>About the Author</h6>
                        <p className="text-muted">Short section about the author.</p>
                    </div>
                  </div>
                )}


                {/* article posts */}
                {post.type === 'article' && (
                    <div>
                        <div className="article-header">
                            
                            {isAuthor ? (isEditing === "title" ? (
                                <input 
                                    type="text"
                                    className="form-control mb-2"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)} 
                                    onBlur={handleSave} //stop edititng when clicked away
                                    autoFocus
                                />
                                ) : (
                                    <h2 className="card-title mb-2" onDoubleClick={() => setIsEditing("title")}>{post.title}</h2>
                                )) : (
                                    <h2 className="card-title mb-2">{post.title}</h2>
                            )}

                            {isEditing === "title" && (
                                <button className="btn btn-success" onClick={handleSave}>
                                    Save
                                </button>
                            )}
                        
                        
                            <div className="d-flex align-items-center justify-content-between">
                            <h6 className="card-subtitle text-muted"> By: <Link to={`/publicprofile/${uid || post.author}`}>{post.author}</Link> | Date: {formattedDate}  | Last update: {formattedLastUpdated}</h6> {/* will need to add author field to the db */}
                                <div className="d-flex align-items-center gap-2">
                                    <button className="btn btn-light" onClick={handleLike}>
                                        <i className="bi bi-hand-thumbs-up"></i> {likes.length}
                                    </button>
                                    <button className="btn btn-light ms-2" onClick={handleDislike}>
                                        <i className="bi bi-hand-thumbs-down"></i> {dislikes.length}
                                    </button>    
                                </div>
                            </div>
                        </div>

                        <div className="card-body">
                            
                            {post.thumbnailURL && (
                                <img src={post.thumbnailURL} alt="Article thumbnail" className="card-img-top" style={{maxHeight: "800px", objectFit: "cover"}} />
                            )}

                            {isAuthor ? (isEditing === "body" ? (
                                <ReactQuill
                                    value={editedBody}
                                    onChange={setEditedBody}
                                    onBlur={handleSave}
                                    autoFocus
                                    modules={modules}
                                />
                                ) : (
                                    <div className="article-body" onDoubleClick={() => setIsEditing("body")} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }} />
                                )) : (
                                    <div className="article-body" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(post.body)}}/> 
                                )}

                            {isEditing === "body" && (
                                <button className="btn btn-success" onClick={handleSave}>
                                    Save
                                </button>
                            )}

                            
                        </div>
                    </div>
                )}
            </div>

            {showMessage && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Notice</h5>
                                <button type="button" className="btn-close" onClick={() => setShowMessage(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>{message}</p>
                                <Link to="/login" className="btn btn-primary">Log In</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentPostPage;

import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from './Firebase';
import 'bootstrap/dist/css/bootstrap.min.css'


const ContentPostPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDescription, setEditedDescription] = useState("");

    const auth = getAuth();
    const currentUser = auth.currentUser;


    //error handling
    useEffect(() => {
        const fetchPost = async () => { //fetch from firebase
            const postDoc = doc(db, 'content-posts', postId);
            const postSnapshot = await getDoc(postDoc);
            if (postSnapshot.exists()) {
                const postData = {id: postId, ...postSnapshot.data()};
                setPost(postData);
                setEditedTitle(postData.title);
                setEditedDescription(postData.description);
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

    const isAuthor = currentUser?.displayName === post.author; //do we have authorId for the author field?

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
            await updateDoc(postRef, {
                title: editedTitle, 
                description: editedDescription
            });
            setPost((prev) => ({
                ...prev, 
                title: editedTitle, 
                description: editedDescription
            }))
            setIsEditing(null);
        } catch(error){
            console.error("Error updating post ", error)
        }
    }





    return (
        <div className="container d-flex justify-content-center align-items-center" style={{marginTop: '50px', marginBottom: '50px'}}>
            <div className={`card ${post.type}-post`} style={{ maxWidth: '600px', width: '100%'}}>
                
                {/* video posts */}

                {post.type === 'video' && (
                    <div>
                        <div className="card-header">
                            <video className="card-img-top" controls poster={post.thumbnailURL}>
                                <source src={post.fileURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
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
                        
                        <h6 className="card-subtitle text-muted"> By: {post.author} </h6> {/* will need to add author field to the db */}
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
                        
                        <h6 className="card-subtitle text-muted"> By: {post.author} </h6> {/* will need to add author field to the db */}
                        
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
                            <h2 className="card-title mb-2">{post.title}</h2>
                            <p className="text-muted">
                                By: {post.author} | Date: {post.date}
                            </p>
                        </div>

                        <div className="card-body">
                            <p className="card-text">{post.description}</p>
                            <div dangerouslySetInnerHTML={{ __html: post.body }} className="article-body" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentPostPage;

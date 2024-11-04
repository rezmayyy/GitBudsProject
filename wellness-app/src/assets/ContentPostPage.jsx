import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './Firebase';
import 'bootstrap/dist/css/bootstrap.min.css'


const ContentPostPage = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    //error handling
    useEffect(() => {
        const fetchPost = async () => { //fetch from firebase
            const postDoc = doc(db, 'content-posts', postId);
            const postSnapshot = await getDoc(postDoc);
            if (postSnapshot.exists()) {
                setPost({ id: postId, ...postSnapshot.data() });
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

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{marginTop: '50px', marginBottom: '50px'}}>
            <div className={`card ${post.type}-post`} style={{ maxWidth: '600px', width: '100%'}}>
                
                {/* video posts */}

                {post.type === 'video' && (
                    <div>
                        <div className="card-header">
                            <video className="card-img-top" controls>
                                <source src={post.fileURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                
                        {/* title and description */}
                        <div className="card-body">
                            <h5 className="card-title">{post.title}</h5>
                            <p className="card-text">{post.description}</p>
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
                      <h5 className="card-title mt-3">{post.title}</h5>
                      <p className="card-text">{post.description}</p>
                      <h6 className="card-subtitle text-muted">By: {post.author}</h6>
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

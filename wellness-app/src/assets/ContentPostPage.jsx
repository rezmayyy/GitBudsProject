import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './Firebase';

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
        <div>
            <h1>{post.title}</h1>
            <p>{post.description}</p>
            {post.type === 'video' && ( //video posts
                <video controls>
                    <source src={post.fileURL} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}

            {post.type === 'audio' && ( //audio posts
                <div className="audio-player">
                    <img
                        src={post.thumbnailURL}
                        alt="Audio Thumbnail"
                        style={{ width: '150px', height: 'auto', marginRight: '20px' }}
                    />
                    <div />
                    <audio controls>
                        <source src={post.fileURL} type="audio/mpeg" />
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            )}
            
            <h3>By: {post.author}</h3> {/* Displaying author */}
            {post.type === 'article' && ( //article posts
                <div>
                    <div dangerouslySetInnerHTML={{ __html: post.body }} /> {/* for now */}
                </div>
            )}

        </div>
    );
};

export default ContentPostPage;

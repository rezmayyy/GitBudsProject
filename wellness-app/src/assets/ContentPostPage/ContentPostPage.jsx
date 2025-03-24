import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../Firebase';
import { format } from "date-fns";
import { getUserIdByDisplayName } from '../../Utils/firebaseUtils';
import { useTags } from "../TagSystem/useTags";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import CommentsSection from './CommentsSection';
import TagSelector from '../TagSystem/TagSelector';
import styles from './ContentPostPage.module.css';

const ContentPostPage = () => {
    const { postId } = useParams();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authorName, setAuthorName] = useState('[Deleted]');

    // Editing state (for title, description, body)
    const [isEditing, setIsEditing] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedBody, setEditedBody] = useState('');

    // Tag-related state
    const [tags, setTags] = useState([]);
    const [tagNames, setTagNames] = useState({});

    // Interaction state
    const [likes, setLikes] = useState([]);
    const [dislikes, setDislikes] = useState([]);

    // For showing messages
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(null);

    const fetchAuthorName = async (userId) => {
        const userSnap = await getDoc(doc(db, 'users', userId));
        return userSnap.exists() ? userSnap.data().displayName : '[Deleted]';
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch tags from 'tags' collection and build a mapping (id -> name)
                const tagsCollection = await getDocs(collection(db, 'tags'));
                const tagsMap = {};
                tagsCollection.forEach(tagDoc => {
                    const tagData = tagDoc.data();
                    tagsMap[tagDoc.id] = tagData.name;
                });
                setTagNames(tagsMap);

                // Fetch the post document
                const postDoc = doc(db, 'content-posts', postId);
                const postSnapshot = await getDoc(postDoc);

                if (postSnapshot.exists()) {
                    const postData = { id: postId, ...postSnapshot.data() };

                    // Determine author name
                    let fetchedAuthorName;
                    if (postData.userId) {
                        fetchedAuthorName = await fetchAuthorName(postData.userId);
                    } else if (postData.author) {
                        fetchedAuthorName = postData.author;
                    } else {
                        fetchedAuthorName = '[Deleted]';
                    }

                    setPost({ ...postData, authorName: fetchedAuthorName });
                    setEditedTitle(postData.title || "");
                    setEditedDescription(postData.description || "");
                    setEditedBody(postData.body || "");
                    setLikes(postData.likes || []);
                    setDislikes(postData.dislikes || []);

                    // Process tags for the post: convert tag IDs to { value, label }
                    const postTags = postData.tags || [];
                    const tagObjects = postTags.map((tagId) => ({
                        value: tagId,
                        label: tagsMap[tagId] || tagId
                    }));
                    setTags(tagObjects);

                    // Check authorization: if post status is approved or user is admin/moderator or author.
                    if (postData.status === 'approved') {
                        setIsAuthorized(true);
                    } else if (currentUser) {
                        const userRef = doc(db, 'users', currentUser.uid);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists()) {
                            const role = userSnap.data().role;
                            const adminOrMod = role === 'admin' || role === 'moderator';
                            if (postData.status === 'approved' || adminOrMod || currentUser.uid === postData.userId || currentUser.displayName === postData.author) {
                                setIsAuthorized(true);
                            } else {
                                setError('You do not have permission to view this post.');
                            }
                        }
                    }
                } else {
                    setError('Post does not exist.');
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data.');
                setLoading(false);
            }
        };

        fetchData();
    }, [postId, currentUser]);

    const handleSaveTags = async () => {
        if (!post) return;
        const postRef = doc(db, "content-posts", post.id);
        const tagIds = tags.map(tag => tag.value);

        await updateDoc(postRef, { tags: tagIds, lastUpdated: serverTimestamp() });
        setPost((prev) => ({
            ...prev,
            tags: tagIds
        }));
        setIsEditing('');
    };

    const handleEditTags = () => {
        if (isEditing !== "tags") {
            setIsEditing("tags");
        }
    };

    const selectedTagNames = tags.map(tag => tag.label);

    const handleInteraction = async (type) => {
        if (!currentUser) {
            setMessage('You must be logged in.');
            setShowMessage(true);
            return;
        }

        const postRef = doc(db, 'content-posts', postId);
        const updatedLikes = [...likes.filter(uid => uid !== currentUser.uid)];
        const updatedDislikes = [...dislikes.filter(uid => uid !== currentUser.uid)];

        if (type === 'like' && !likes.includes(currentUser.uid)) updatedLikes.push(currentUser.uid);
        if (type === 'dislike' && !dislikes.includes(currentUser.uid)) updatedDislikes.push(currentUser.uid);

        await updateDoc(postRef, { likes: updatedLikes, dislikes: updatedDislikes });

        setLikes(updatedLikes);
        setDislikes(updatedDislikes);
    };

    const handleSave = async () => {
        if (!post) return;
        const postRef = doc(db, 'content-posts', postId);
        const updatedData = {
            title: editedTitle,
            description: editedDescription,
            body: editedBody,
            lastUpdated: serverTimestamp(),
        };

        await updateDoc(postRef, updatedData);
        setPost({ ...post, ...updatedData });
        setIsEditing('');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!post) return <div>Post not found</div>;

    const formattedDate = post.timestamp ? format(post.timestamp.toDate(), 'PP p') : 'Unknown Date';
    const formattedLastUpdated = post.lastUpdated ? format(post.lastUpdated.toDate(), 'PP p') : 'Never updated';

    const quillModules = {
        toolbar: [
            [{ header: [3, 4, 5, 6, false] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ color: [] }, { background: [] }, { align: [] }],
            ['link', 'image'],
            ['clean'],
        ],
    };

    return (
        <div className={styles.pageContainer}>
            {/* Media Container */}
            <div className={styles.videoContainer}>
                {post.type === 'video' && (
                    <>
                        <div
                            className={styles.thumbnailContainer}
                            onClick={(e) => {
                                const video = e.currentTarget.querySelector('video');
                                video.play();
                                e.currentTarget.querySelector('img').style.display = 'none';
                            }}
                        >
                            <img src={post.thumbnailURL} alt="Thumbnail" />
                            <video className={styles.videoPlayer} controls>
                                <source src={post.fileURL} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className={styles.contentHeader}>
                            <h2 className={styles.title}>{post.title}</h2>
                            <p className={styles.description}>{post.description}</p>
                            <div className={styles.authorInfo}>
                                By: <Link to={`/profile/${post.userId}`}>{post.authorName}</Link> | {formattedDate}
                            </div>
                            <div className={styles.interactionContainer}>
                                <button className={styles.emojiButton} onClick={() => handleInteraction('like')}>
                                    👍
                                </button>
                                <span>{likes.length}</span>
                                <button className={styles.emojiButton} onClick={() => handleInteraction('dislike')}>
                                    👎
                                </button>
                                <span>{dislikes.length}</span>
                            </div>
                        </div>
                    </>
                )}

                {post.type === 'audio' && (
                    <>
                        <img className={styles.thumbnailContainer} src={post.thumbnailURL} alt="Audio Thumbnail" />
                        <audio className={styles.videoPlayer} controls>
                            <source src={post.fileURL} type="audio/mpeg" />
                        </audio>
                        <div className={styles.contentHeader}>
                            <h2 className={styles.title}>{post.title}</h2>
                            <p className={styles.description}>{post.description}</p>
                            <div className={styles.authorInfo}>
                                By: <Link to={`/profile/${post.userId}`}>{post.authorName}</Link> | {formattedDate}
                            </div>
                            <div className={styles.interactionContainer}>
                                <button className={styles.emojiButton} onClick={() => handleInteraction('like')}>
                                    👍
                                </button>
                                <span>{likes.length}</span>
                                <button className={styles.emojiButton} onClick={() => handleInteraction('dislike')}>
                                    👎
                                </button>
                                <span>{dislikes.length}</span>
                            </div>
                        </div>
                    </>
                )}

                {post.type === 'article' && (
                    <div className={styles.contentHeader}>
                        <h2 className={styles.title}>{post.title}</h2>
                        <p className={styles.description}>{post.description}</p>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }} />
                        <div className={styles.authorInfo}>
                            By: <Link to={`/profile/${post.userId}`}>{post.authorName}</Link> | {formattedDate}
                        </div>
                        <div className={styles.interactionContainer}>
                            <button className={styles.emojiButton} onClick={() => handleInteraction('like')}>
                                👍
                            </button>
                            <span>{likes.length}</span>
                            <button className={styles.emojiButton} onClick={() => handleInteraction('dislike')}>
                                👎
                            </button>
                            <span>{dislikes.length}</span>
                        </div>

                        {/* Tags section */}
                        <div className="card-body">
                            {isEditing === "tags" ? (
                                <div>
                                    <TagSelector
                                        selectedTags={tags}  // Ensuring tags is an array
                                        setSelectedTags={setTags}
                                    />
                                    <button className="btn btn-success" onClick={handleSaveTags}>
                                        Save Tags
                                    </button>
                                </div>
                            ) : (
                                <div onDoubleClick={handleEditTags}>
                                    <strong>Tags:</strong> {selectedTagNames.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments Section Container */}
                <div className={styles.commentsSection}>
                    <CommentsSection postId={post.id} currentUser={currentUser} />
                </div>

                {/* Modal for Messages */}
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
        </div>
    );
};

export default ContentPostPage;

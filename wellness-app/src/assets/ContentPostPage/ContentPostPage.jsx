import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../Firebase';
import { format } from "date-fns";
import { useTags } from "../TagSystem/useTags";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import CommentsSection from './CommentsSection';
import ReportButton from '../ReportButton/Report';
import { validateFile, uploadFileToStorage } from '../../Utils/fileUtils';
import ReactQuill from 'react-quill';
import TagSelector from '../TagSystem/TagSelector';
import styles from './ContentPostPage.module.css';
import ContentDisplayView from './ContentDisplayView';
import ContentEditForm from './ContentEditForm';

const ContentPostPage = () => {
    const { postId } = useParams();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authorName, setAuthorName] = useState('[Deleted]');
    const [interactionCount, setInteractionCount] = useState(0);

    // Editing state (for title, description, body)
    const [isEditing, setIsEditing] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedBody, setEditedBody] = useState('');

    // Tag-related state
    const [tags, setTags] = useState([]);
    const [tagNames, setTagNames] = useState({});

    // Interaction state for views
    const [views, setViews] = useState(0);

    // For showing messages and errors
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(null);

    // Helper function to format timestamps safely.
    const formatTimestamp = (ts, fmt = 'PP p') => {
        if (!ts) return 'Unknown Date';
        let dateObj;
        if (typeof ts.toDate === 'function') {
            dateObj = ts.toDate();
        } else {
            dateObj = new Date(ts);
        }
        return isNaN(dateObj) ? 'Invalid Date' : format(dateObj, fmt);
    };

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
                const postRef = doc(db, 'content-posts', postId);
                const postSnapshot = await getDoc(postRef);

                if (postSnapshot.exists()) {
                    const postData = { id: postId, ...postSnapshot.data() };

                    // Determine author name from users collection
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
                    setViews(postData.views || 0);

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
                            if (postData.status === 'approved' || adminOrMod || currentUser.uid === postData.userId) {
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

        // Check if the post has already been viewed in this session to update view count.
        const viewedKey = `viewed_${postId}`;
        if (!sessionStorage.getItem(viewedKey)) {
            handleInteraction('view');
        }
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

    // Updated interaction handler using subcollections for likes/dislikes.
    const handleInteraction = async (type) => {
        if (type === 'view') {
            const viewedKey = `viewed_${postId}`;
            const lastViewedTime = localStorage.getItem(viewedKey);
            const now = new Date().getTime();
            if (!lastViewedTime || (now - lastViewedTime) > 24 * 60 * 60 * 1000) {
                localStorage.setItem(viewedKey, now);
                const postRef = doc(db, 'content-posts', postId);
                await updateDoc(postRef, { views: increment(1) });
                const updatedPostSnap = await getDoc(postRef);
                if (updatedPostSnap.exists()) {
                    setViews(updatedPostSnap.data().views || 0);
                }
            }
            return;
        }
        if (!currentUser) {
            setMessage('You must be logged in.');
            return;
        }
        if (type === 'like') {
            const likeRef = doc(db, 'content-posts', postId, 'likes', currentUser.uid);
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) {
                await deleteDoc(likeRef);
            } else {
                await setDoc(likeRef, {}); // No timestamp needed.
                const dislikeRef = doc(db, 'content-posts', postId, 'dislikes', currentUser.uid);
                const dislikeSnap = await getDoc(dislikeRef);
                if (dislikeSnap.exists()) {
                    await deleteDoc(dislikeRef);
                }
            }
        } else if (type === 'dislike') {
            const dislikeRef = doc(db, 'content-posts', postId, 'dislikes', currentUser.uid);
            const dislikeSnap = await getDoc(dislikeRef);
            if (dislikeSnap.exists()) {
                await deleteDoc(dislikeRef);
            } else {
                await setDoc(dislikeRef, {}); // No timestamp needed.
                const likeRef = doc(db, 'content-posts', postId, 'likes', currentUser.uid);
                const likeSnap = await getDoc(likeRef);
                if (likeSnap.exists()) {
                    await deleteDoc(likeRef);
                }
            }
        }
        // Increment the counter so ContentDisplayView re-fetches the counts.
        setInteractionCount(prev => prev + 1);
    };

    const handleSave = async () => {
        if (!post) return;
        const slurRegex = /\b(?:nigger|kike|chink|spic|gook)\b/i;
        if (slurRegex.test(editedTitle) || slurRegex.test(editedDescription)) {
            setError("Your update contains inappropriate language.");
            return;
        }

        const postRef = doc(db, 'content-posts', postId);
        const updatedData = {
            title: editedTitle,
            description: editedDescription,
            body: editedBody,
            tags: tags.map(t => t.value),
            lastUpdated: serverTimestamp(),
        };

        await updateDoc(postRef, updatedData);
        setPost({ ...post, ...updatedData });
        setIsEditing('');
    };

    const handleQuillImageUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/bmp";
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!(await validateFile(file, 'image'))) return;
            const url = await uploadFileToStorage(file, `article-images/${currentUser.uid}`);
            setEditedBody(prev => prev + `<img src="${url}" alt="Uploaded Image"/>`);
        };
    };

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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!post) return <div>Post not found</div>;

    const formattedDate = post.timestamp ? formatTimestamp(post.timestamp, 'PP p') : 'Unknown Date';
    let formattedLastUpdated = "Never updated";

    if (post.lastUpdated) {
        formattedLastUpdated = formatTimestamp(post.lastUpdated, 'PP p');
    }

    const canEdit = currentUser?.uid === post.userId;

    return (
        <div className={styles.pageContainer}>
            {isEditing === "content" ? (
                <ContentEditForm
                    type={post.type}
                    title={editedTitle}
                    description={editedDescription}
                    body={editedBody}
                    tags={tags}
                    onChangeTitle={setEditedTitle}
                    onChangeDescription={setEditedDescription}
                    onChangeBody={setEditedBody}
                    onChangeTags={setTags}
                    onSave={handleSave}
                    onCancel={() => setIsEditing('')}
                />
            ) : (
                <ContentDisplayView
                    post={post}
                    canEdit={canEdit}
                    onEdit={() => setIsEditing("content")}
                    handleInteraction={handleInteraction}
                    formattedDate={formattedDate}
                    selectedTagNames={selectedTagNames}
                    interactionCount={interactionCount}
                />
            )}
            <CommentsSection postId={post.id} currentUser={currentUser} />
        </div>
    );
};

export default ContentPostPage;

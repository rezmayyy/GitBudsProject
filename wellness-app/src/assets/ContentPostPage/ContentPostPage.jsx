import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!post) return <div>Post not found</div>;

    const formattedDate = post.timestamp ? format(post.timestamp.toDate(), 'PP p') : 'Unknown Date';
    let updatedDate = null;
    let formattedLastUpdated = "Never updated";

    if (post.lastUpdated) {
        let dateObj;

        // If it’s a Firestore Timestamp
        if (typeof post.lastUpdated.toDate === "function") {
            dateObj = post.lastUpdated.toDate();
        }
        // If it’s already a Date
        else if (post.lastUpdated instanceof Date) {
            dateObj = post.lastUpdated;
        }
        // If it’s a parsable string
        else if (!isNaN(Date.parse(post.lastUpdated))) {
            dateObj = new Date(post.lastUpdated);
        }

        if (dateObj instanceof Date && !isNaN(dateObj)) {
            formattedLastUpdated = format(dateObj, "PP p");
        }
    }
    const canEdit = currentUser?.uid === post.userId;
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
                    onCancel={() => setIsEditing("")}
                />
            ) : (
                <ContentDisplayView
                    post={post}
                    canEdit={canEdit}
                    onEdit={() => setIsEditing("content")}
                    likes={likes}
                    dislikes={dislikes}
                    onLike={() => handleInteraction("like")}
                    onDislike={() => handleInteraction("dislike")}
                />
            )}
            <CommentsSection postId={post.id} currentUser={currentUser} />
        </div>
    );
}
export default ContentPostPage;

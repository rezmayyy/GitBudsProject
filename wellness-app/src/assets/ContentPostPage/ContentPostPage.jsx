// ContentPostPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    getDocs,
    increment,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../Firebase';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import CommentsSection from './CommentsSection';
import ReportButton from '../ReportButton/Report';
import TagSelector from '../TagSystem/TagSelector';
import { validateFile, uploadFileToStorage } from '../../Utils/fileUtils';
import { getUserById } from '../../Utils/firebaseUtils';
import ContentDisplayView from './ContentDisplayView';
import ContentEditForm from './ContentEditForm';
import styles from './ContentPostPage.module.css';

const ContentPostPage = () => {
    const { postId } = useParams();
    const auth = getAuth();

    // — wait for auth to initialize —
    const [authChecked, setAuthChecked] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setAuthChecked(true);
        });
        return unsubscribe;
    }, [auth]);

    // — page state —
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    // editing
    const [isEditing, setIsEditing] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedBody, setEditedBody] = useState('');

    // tags
    const [tags, setTags] = useState([]);
    const [tagNames, setTagNames] = useState({});

    // interactions / counters
    const [views, setViews] = useState(0);
    const [interactionCount, setInteractionCount] = useState(0);

    // messages
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);

    // format timestamp helper
    const formatTimestamp = (ts, fmt = 'PP p') => {
        if (!ts) return 'Unknown Date';
        const dateObj = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        return isNaN(dateObj) ? 'Invalid Date' : format(dateObj, fmt);
    };

    // fetch displayName for a userId
    const fetchAuthorName = async uid => {
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? snap.data().displayName : '[Deleted]';
    };

    // — MAIN DATA FETCH: only after authChecked —
    useEffect(() => {
        if (!authChecked) return;
        setLoading(true);

        (async () => {
            try {
                // load all tags
                const tagSnap = await getDocs(collection(db, 'tags'));
                const names = {};
                tagSnap.forEach(d => (names[d.id] = d.data().name));
                setTagNames(names);

                // load post document
                const postRef = doc(db, 'content-posts', postId);
                const postSnap = await getDoc(postRef);
                if (!postSnap.exists()) {
                    setError('Post not found.');
                    setLoading(false);
                    return;
                }
                const data = { id: postId, ...postSnap.data() };

                // resolve authorName
                let authorName = '[Deleted]';
                if (data.userId) {
                    authorName = await fetchAuthorName(data.userId);
                } else if (data.author) {
                    authorName = data.author;
                }

                setPost({ ...data, authorName });
                setEditedTitle(data.title || '');
                setEditedDescription(data.description || '');
                setEditedBody(data.body || '');
                setViews(data.views || 0);

                // prep tags for selector
                const initialTags = (data.tags || []).map(id => ({
                    value: id,
                    label: names[id] || id
                }));
                setTags(initialTags);

                // check authorization
                const isAdminOrMod = async () => {
                    if (!currentUser) return false;
                    const uSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    const role = uSnap.exists() ? uSnap.data().role : '';
                    return role === 'admin' || role === 'moderator';
                };

                if (data.status === 'approved') {
                    setIsAuthorized(true);
                } else if (
                    currentUser &&
                    (await isAdminOrMod()) ||
                    currentUser?.uid === data.userId
                ) {
                    setIsAuthorized(true);
                } else {
                    setError('You do not have permission to view this post.');
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data.');
                setLoading(false);
            }
        })();

        // bump view count once per session
        const viewedKey = `viewed_${postId}`;
        if (!sessionStorage.getItem(viewedKey)) {
            handleInteraction('view');
        }
    }, [authChecked, postId, currentUser]);

    // — tag save handler —
    const handleSaveTags = async () => {
        if (!post) return;
        const postRef = doc(db, 'content-posts', post.id);
        const tagIds = tags.map(t => t.value);
        await updateDoc(postRef, { tags: tagIds, lastUpdated: serverTimestamp() });
        setPost(prev => ({ ...prev, tags: tagIds }));
        setIsEditing('');
    };

    // — full save handler —
    const handleSave = async () => {
        if (!post) return;
        const postRef = doc(db, 'content-posts', post.id);
        const updated = {
            title: editedTitle,
            description: editedDescription,
            body: editedBody,
            tags: tags.map(t => t.value),
            lastUpdated: serverTimestamp()
        };
        await updateDoc(postRef, updated);
        setPost(prev => ({ ...prev, ...updated }));
        setIsEditing('');
    };

    // — Quill image upload —
    const handleQuillImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/bmp';
        input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (!(await validateFile(file, 'image'))) return;
            const url = await uploadFileToStorage(file, `article-images/${currentUser.uid}`);
            setEditedBody(prev => prev + `<img src="${url}" alt="Uploaded Image"/>`);
        };
    };

    // Quill modules
    const quillModules = {
        toolbar: [
            [{ header: [3, 4, 5, 6, false] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ color: [] }, { background: [] }, { align: [] }],
            ['link', 'image'],
            ['clean']
        ]
    };

    // — interaction handler (views, like/dislike) —
    const handleInteraction = async type => {
        if (type === 'view') {
            const key = `viewed_${postId}`;
            const last = localStorage.getItem(key);
            const now = Date.now();
            if (!last || now - last > 24 * 60 * 60 * 1000) {
                localStorage.setItem(key, now);
                const ref = doc(db, 'content-posts', postId);
                await updateDoc(ref, { views: increment(1) });
                const snap = await getDoc(ref);
                setViews(snap.exists() ? snap.data().views : views);
            }
            return;
        }

        if (!currentUser) {
            setMessage('You must be logged in.');
            setShowMessage(true);
            return;
        }

        const likeRef = doc(db, 'content-posts', postId, 'likes', currentUser.uid);
        const dislikeRef = doc(db, 'content-posts', postId, 'dislikes', currentUser.uid);
        if (type === 'like') {
            const likeSnap = await getDoc(likeRef);
            if (likeSnap.exists()) {
                await deleteDoc(likeRef);
            } else {
                await setDoc(likeRef, {});
                const dSnap = await getDoc(dislikeRef);
                if (dSnap.exists()) await deleteDoc(dislikeRef);
            }
        } else if (type === 'dislike') {
            const disSnap = await getDoc(dislikeRef);
            if (disSnap.exists()) {
                await deleteDoc(dislikeRef);
            } else {
                await setDoc(dislikeRef, {});
                const lSnap = await getDoc(likeRef);
                if (lSnap.exists()) await deleteDoc(likeRef);
            }
        }

        setInteractionCount(c => c + 1);
    };

    if (!authChecked || loading) return <div>Loading…</div>;
    if (error) return <div>{error}</div>;
    if (!post) return <div>Post not found</div>;

    const formattedDate = post.timestamp
        ? formatTimestamp(post.timestamp)
        : 'Unknown Date';

    const canEdit = currentUser?.uid === post.userId;

    return (
        <div className={styles.pageContainer}>
            {isEditing === 'content' ? (
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
                    modules={quillModules}
                    onImageUpload={handleQuillImageUpload}
                />
            ) : (
                <ContentDisplayView
                    post={post}
                    canEdit={canEdit}
                    onEdit={() => setIsEditing('content')}
                    handleInteraction={handleInteraction}
                    formattedDate={formattedDate}
                    selectedTagNames={tags.map(t => t.label)}
                    interactionCount={interactionCount}
                />
            )}

            <CommentsSection postId={post.id} currentUser={currentUser} />
        </div>
    );
};

export default ContentPostPage;

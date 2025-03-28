import React, { useEffect, useState, useContext } from "react";
import { getAuth } from 'firebase/auth';
import { Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import DOMPurify from "dompurify";
import { db } from "../Firebase";
import styles from "./ContentPostPage.module.css";
import ReportButton from "../ReportButton/Report";
import UserContext from '../UserContext';

// Helper to safely format a Firestore timestamp or date string.
const formatTimestamp = (ts, fmt = "PP p") => {
    if (!ts) return "Never updated";
    let dateObj;
    if (typeof ts.toDate === "function") {
        dateObj = ts.toDate();
    } else {
        dateObj = new Date(ts);
    }
    return isNaN(dateObj) ? "Just now" : dateObj.toLocaleString();
};

export default function ContentDisplayView({
    post,
    canEdit,
    onEdit,
    handleInteraction,
    formattedDate,
    selectedTagNames,
    interactionCount
}) {
    const { user } = useContext(UserContext);
    const [profilePic, setProfilePic] = useState(null);
    const [likeCount, setLikeCount] = useState(0);
    const [dislikeCount, setDislikeCount] = useState(0);

    useEffect(() => {
        const fetchProfilePic = async () => {
            if (post.userId) {
                const userRef = doc(db, "users", post.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.profilePicUrl) setProfilePic(data.profilePicUrl);
                }
            }
        };
        fetchProfilePic();
    }, [post.userId]);

    // Fetch likes and dislikes counts from subcollections
    useEffect(() => {
        const fetchInteractionCounts = async () => {
            try {
                const likesSnapshot = await getDocs(
                    collection(db, "content-posts", post.id, "likes")
                );
                const dislikesSnapshot = await getDocs(
                    collection(db, "content-posts", post.id, "dislikes")
                );
                setLikeCount(likesSnapshot.size);
                setDislikeCount(dislikesSnapshot.size);
            } catch (error) {
                console.error("Error fetching interaction counts: ", error);
            }
        };
        fetchInteractionCounts();
    }, [post.id, interactionCount]);

    return (
        <>
            {/* Video */}
            {post.type === "video" && (
                <div className={styles.thumbnailContainer} onClick={e => {
                    const video = e.currentTarget.querySelector("video");
                    video.play();
                    e.currentTarget.querySelector("img").style.display = "none";
                }}>
                    <img src={post.thumbnailURL} alt="Thumbnail" />
                    <video className={styles.videoPlayer} controls>
                        <source src={post.fileURL} type="video/mp4" />
                    </video>
                </div>
            )}

            {/* Audio */}
            {post.type === "audio" && (
                <>
                    <img className={styles.thumbnailContainer} src={post.thumbnailURL} alt="Audio Thumbnail" />
                    <audio className={styles.videoPlayer} controls>
                        <source src={post.fileURL} type="audio/mpeg" />
                    </audio>
                </>
            )}

            {/* Title & Metadata */}
            <div className={styles.contentHeader}>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <div className={styles.modTools}>
                        {user.role === 'admin' && (
                            <button
                                className={styles.deleteButton}
                                onClick={async () => {
                                    if (window.confirm("Are you sure you want to permanently delete this post?")) {
                                        try {
                                            const storage = getStorage();

                                            // Delete main file
                                            try {
                                                const filePath = new URL(post.fileURL).pathname.split('/o/')[1].split('?')[0];
                                                const decodedPath = decodeURIComponent(filePath);
                                                const fileRef = storageRef(storage, decodedPath);
                                                await deleteObject(fileRef);
                                            } catch (err) {
                                                if (err.code === 'storage/object-not-found') {
                                                    console.warn("Main file already deleted.");
                                                } else {
                                                    console.error("Error deleting main file:", err);
                                                }
                                            }

                                            // Delete thumbnail if present
                                            if (post.thumbnailURL) {
                                                try {
                                                    const thumbPath = new URL(post.thumbnailURL).pathname.split('/o/')[1].split('?')[0];
                                                    const decodedThumb = decodeURIComponent(thumbPath);
                                                    const thumbRef = storageRef(storage, decodedThumb);
                                                    await deleteObject(thumbRef);
                                                } catch (err) {
                                                    if (err.code === 'storage/object-not-found') {
                                                        console.warn("Thumbnail already deleted.");
                                                    } else {
                                                        console.error("Error deleting thumbnail:", err);
                                                    }
                                                }
                                            }

                                            // Delete Firestore post doc
                                            await deleteDoc(doc(db, 'content-posts', post.id));
                                            alert("Post deleted.");
                                        } catch (err) {
                                            console.error("Final deletion error:", err);
                                            alert("Something went wrong during deletion.");
                                        }
                                    }
                                }}
                            >
                                🗑️ Delete Post
                            </button>
                        )}

                        <button
                            className={styles.rejectButton}
                            onClick={async () => {
                                if (window.confirm("Hide this post by marking it as rejected?")) {
                                    try {
                                        const postRef = doc(db, 'content-posts', post.id);
                                        await updateDoc(postRef, { status: 'rejected' });
                                        alert("Post hidden.");
                                    } catch (err) {
                                        console.error("Error updating status:", err);
                                        alert("Error hiding post.");
                                    }
                                }
                            }}
                        >
                            🚫 Hide Post
                        </button>
                    </div>
                )}

                <div className={styles.topRow}>
                    <div className={styles.leftColumn}>
                        <h2 className={styles.titleLeft}>{post.title}</h2>
                    </div>

                    <div className={styles.centerColumn}>
                        <div className={styles.interactionCenter}>
                            <button className={styles.emojiButton} onClick={() => handleInteraction("like")}>👍</button>
                            <span>{likeCount}</span>
                            <button className={styles.emojiButton} onClick={() => handleInteraction("dislike")}>👎</button>
                            <span>{dislikeCount}</span>
                            {post.userId !== undefined && (
                                <ReportButton
                                    contentUrl={window.location.href}
                                    profileUrl={`/profile/${post.userId}`}
                                    userId={post.userId}
                                    iconOnly={true}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.metaRow}>
                    {profilePic && (
                        <img
                            src={profilePic}
                            alt="Author"
                            className={styles.profilePic}
                            width={32}
                            height={32}
                        />
                    )}
                    <span>
                        <Link to={`/profile/${post.userId}`}>{post.authorName}</Link>
                    </span>

                    {canEdit && (
                        <button className={styles.editButton} onClick={onEdit}>
                            Edit
                        </button>
                    )}
                </div>

                <div className={styles.grayDescriptionBox}>
                    <div className={styles.descriptionHeaderRow}>
                        <div className={styles.descriptionLeft}>
                            Views: {post.views || 0} • {formattedDate}
                        </div>
                        <div className={styles.descriptionRight}>
                            edited: {formatTimestamp(post.lastUpdated)}
                        </div>
                    </div>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(post.description),
                        }}
                    />
                </div>

                {post.type === "article" && (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }} />
                        <p><strong>Tags:</strong> {selectedTagNames.join(", ")}</p>
                    </>
                )}
            </div>
        </>
    );
}

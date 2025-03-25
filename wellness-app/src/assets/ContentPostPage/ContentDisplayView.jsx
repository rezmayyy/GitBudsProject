import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import DOMPurify from "dompurify";
import { db } from "../Firebase";
import styles from "./ContentPostPage.module.css";

export default function ContentDisplayView({
    post,
    canEdit,
    onEdit,
    likes,
    dislikes,
    handleInteraction,
    formattedDate,
    selectedTagNames
}) {
    const [profilePic, setProfilePic] = useState(null);

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
                <div className={styles.topRow}>
                    <div className={styles.leftColumn}>
                        <h2 className={styles.titleLeft}>{post.title}</h2>
                    </div>

                    <div className={styles.centerColumn}>
                        <div className={styles.interactionCenter}>
                            <button className={styles.emojiButton} onClick={() => handleInteraction("like")}>👍</button>
                            <span>{likes.length}</span>
                            <button className={styles.emojiButton} onClick={() => handleInteraction("dislike")}>👎</button>
                            <span>{dislikes.length}</span>
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
                            edited: {post.lastUpdated?.toDate().toLocaleString()}
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

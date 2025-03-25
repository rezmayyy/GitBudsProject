import React from "react";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";
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

            {/* Common header */}
            <div className={styles.contentHeader}>
                <h2 className={styles.title}>{post.title}</h2>
                <div
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(post.description)
                    }}
                />
                <div className={styles.authorInfo}>
                    By <Link to={`/profile/${post.userId}`}>{post.authorName}</Link> | {formattedDate}
                    {canEdit && (
                        <button className={styles.editButton} onClick={onEdit}>
                            Edit
                        </button>
                    )}
                </div>

                {/* Likes / Dislikes */}
                <div className={styles.interactionContainer}>
                    <button className={styles.emojiButton} onClick={() => handleInteraction("like")}>👍</button>
                    <span>{likes.length}</span>
                    <button className={styles.emojiButton} onClick={() => handleInteraction("dislike")}>👎</button>
                    <span>{dislikes.length}</span>
                </div>

                {/* Article body + tags */}
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

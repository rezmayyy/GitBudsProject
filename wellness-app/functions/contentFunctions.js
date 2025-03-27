// contentFunctions.js
const { functions, admin, db, Timestamp } = require("./common");
const { validateUploadedFile } = require("./fileUtils");

// Move Ceo Video & Thumbnail
exports.moveCeoVideo = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    // Note: You may want to require an admin check here.
    const { filePath, thumbnailPath } = data.data || data;
    if (!filePath || !thumbnailPath) {
        throw new functions.https.HttpsError("invalid-argument", "Both video and thumbnail file paths are required");
    }
    const bucket = admin.storage().bucket();
    const videoFile = bucket.file(filePath);
    const thumbFile = bucket.file(thumbnailPath);
    try {
        await validateUploadedFile(videoFile, "video", 1024 * 1024 * 1024); // 1 GB limit
        await validateUploadedFile(thumbFile, "image");
        const timestamp = Date.now();
        const finalVideoPath = `CeoVideos/${timestamp}_${videoFile.name.split("/").pop()}`;
        const finalThumbnailPath = `CeoVideos/thumbnails/${timestamp}_${thumbFile.name.split("/").pop()}`;
        await videoFile.move(finalVideoPath);
        await thumbFile.move(finalThumbnailPath);
        await db.collection("adminSettings").doc("fileUploads").collection("CeoVideos").add({
            location: finalVideoPath,
            thumbnail: finalThumbnailPath,
            timestamp: Timestamp.now(),
            uploadedBy: authInfo.uid,
        });
        return {
            message: "Video and thumbnail successfully processed",
            path: finalVideoPath,
            thumbnail: finalThumbnailPath,
        };
    } catch (error) {
        console.error("Error processing Ceo video:", error);
        throw new functions.https.HttpsError("internal", "Failed to process video");
    }
});

// Auto-cleanup for TempVideos
exports.cleanupTempVideos = functions.pubsub.schedule("every 24 hours").onRun(async () => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: "temp/" });
    const expirationTime = Date.now() - 24 * 60 * 60 * 1000;
    const deletions = files
        .filter(file => file.metadata.timeCreated && new Date(file.metadata.timeCreated).getTime() < expirationTime)
        .map(file => file.delete().catch(err => console.warn(`Failed to delete ${file.name}:`, err)));
    await Promise.all(deletions);
    return null;
});

// Create Content Post
exports.createContentPost = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo)
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { postData, filePath, thumbnailPath } = data.data || data;
    const userId = authInfo.uid;
    const bucket = admin.storage().bucket();
    let finalFileUrl = null;
    let finalThumbnailUrl = null;
    if (postData.type !== "article") {
        if (
            !filePath ||
            !thumbnailPath ||
            !filePath.startsWith(`temp/${userId}/`) ||
            !thumbnailPath.startsWith(`temp/${userId}/`)
        ) {
            throw new functions.https.HttpsError("permission-denied", "Invalid file path.");
        }
        const timestamp = Date.now();
        const tempMedia = bucket.file(filePath);
        const mediaFileName = filePath.split("/").pop();
        const finalMediaPath = `content_uploads/${userId}/${timestamp}_${mediaFileName}`;
        await validateUploadedFile(tempMedia, postData.type);
        await tempMedia.move(finalMediaPath);
        const movedMedia = bucket.file(finalMediaPath);
        await movedMedia.makePublic();
        finalFileUrl = `https://storage.googleapis.com/${bucket.name}/${finalMediaPath}`;
        const tempThumb = bucket.file(thumbnailPath);
        const thumbFileName = thumbnailPath.split("/").pop();
        const finalThumbPath = `thumbnails/${userId}/${timestamp}_${thumbFileName}`;
        await validateUploadedFile(tempThumb, "image");
        await tempThumb.move(finalThumbPath);
        const movedThumb = bucket.file(finalThumbPath);
        await movedThumb.makePublic();
        finalThumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${finalThumbPath}`;
    }
    const settingsSnap = await db.collection("adminSettings").doc("uploadRules").get().catch(() => null);
    const autoApprove = settingsSnap?.data()?.AutoApprove === true;
    const newPost = {
        title: postData.title,
        description: postData.description || "",
        body: postData.body || "",
        type: postData.type,
        fileURL: finalFileUrl,
        thumbnailURL: finalThumbnailUrl,
        timestamp: Timestamp.now(),
        status: autoApprove ? "approved" : "pending",
        keywords: Array.isArray(postData.keywords) ? postData.keywords : [],
        userId,
        tags: Array.isArray(postData.tags) ? postData.tags : [],
    };
    const docRef = await db.collection("content-posts").add(newPost);
    return { message: "Post created", postId: docRef.id };
});

// Create Event
exports.createEvent = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const userId = authInfo.uid;
    const {
        title,
        description,
        eventType,
        location,
        date,
        time,
        endTime,
        maxParticipants,
        tempImages,
        selectedThumbnail
    } = data.data || data;
    if (!title || !description || !date || !time || !endTime || !eventType || !location || !Array.isArray(tempImages)) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required event fields.");
    }
    const parsedMax = maxParticipants === "" ? -1 : parseInt(maxParticipants);
    if (isNaN(parsedMax)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid maxParticipants.");
    }
    const eventRef = db.collection("events").doc();
    const eventId = eventRef.id;
    const bucket = admin.storage().bucket();
    const finalImageUrls = [];
    let thumbnailUrl = null;
    for (const { name, path } of tempImages) {
        if (!path.startsWith(`temp/${userId}/`)) {
            throw new functions.https.HttpsError("permission-denied", "Invalid file path.");
        }
        const tempFile = bucket.file(path);
        const fileName = path.split("/").pop();
        const destPath = `event_images/${eventId}/${fileName}`;
        await validateUploadedFile(tempFile, "image", 5 * 1024 * 1024);
        await tempFile.move(destPath);
        const movedFile = bucket.file(destPath);
        await movedFile.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
        finalImageUrls.push(publicUrl);
        if (selectedThumbnail && name === selectedThumbnail) {
            thumbnailUrl = publicUrl;
        }
    }
    if (!thumbnailUrl && finalImageUrls.length > 0) {
        thumbnailUrl = finalImageUrls[0];
    }
    await eventRef.set({
        title,
        title_lower: title.toLowerCase(),
        description,
        date: new Date(date),
        time,
        endTime,
        eventType,
        location,
        maxParticipants: parsedMax,
        images: finalImageUrls,
        thumbnail: thumbnailUrl,
        createdBy: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        attendees: []
    });
    return { message: "Event created successfully", eventId };
});

const { functions, admin, db, Timestamp } = require("./common");
const { validateUploadedFile } = require("./fileUtils");

// Move Ceo Video & Thumbnail
exports.moveCeoVideo = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");

    const { filePath, thumbnailPath } = data.data || data;
    if (!filePath || !thumbnailPath) {
        throw new functions.https.HttpsError("invalid-argument", "Both video and thumbnail file paths are required");
    }

    const bucket = admin.storage().bucket();
    const videoFile = bucket.file(filePath);
    const thumbFile = bucket.file(thumbnailPath);
    const timestamp = Date.now();

    try {
        await validateUploadedFile(filePath, "video", 1024 * 1024 * 1024);
        await validateUploadedFile(thumbnailPath, "image");

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

exports.moveArticleImage = functions.https.onCall(async (data, context) => {
    // 1. Check that the user is authenticated.
    const authInfo = context.auth;
    if (!authInfo) {
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    }
    const userId = authInfo.uid;

    // 2. Get the temporary file path
    const { filePath } = data;
    if (!filePath || typeof filePath !== "string" || !filePath.startsWith(`temp/${userId}/`)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid file path.");
    }

    const bucket = admin.storage().bucket();
    const tempFile = bucket.file(filePath);

    try {
        // 3. Validate the uploaded file (adjust the size limit as needed)
        await validateUploadedFile(filePath, "image", 10 * 1024 * 1024);

        // 4. Construct the final destination path
        const timestamp = Date.now();
        const fileName = filePath.split("/").pop();
        const finalPath = `article-images/${userId}/${timestamp}_${fileName}`;

        // 5. Move the file from the temporary folder to the permanent location
        await tempFile.move(finalPath);

        // 6. Make the file public so that it can be embedded in blogs
        await bucket.file(finalPath).makePublic();

        // 7. Build the public URL (using encoded path)
        const encodedPath = encodeURIComponent(finalPath);
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

        return { imageUrl };
    } catch (error) {
        console.error("Error processing article image:", error);
        throw new functions.https.HttpsError("internal", "Failed to process image");
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
    if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "Login required");

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

        await validateUploadedFile(filePath, postData.type);
        await tempMedia.move(finalMediaPath);
        await bucket.file(finalMediaPath).makePublic();
        finalFileUrl = `https://storage.googleapis.com/${bucket.name}/${finalMediaPath}`;

        const tempThumb = bucket.file(thumbnailPath);
        const thumbFileName = thumbnailPath.split("/").pop();
        const finalThumbPath = `thumbnails/${userId}/${timestamp}_${thumbFileName}`;

        await validateUploadedFile(thumbnailPath, "image");
        await tempThumb.move(finalThumbPath);
        await bucket.file(finalThumbPath).makePublic();
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
    if (!authInfo) throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");

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
        if (typeof path !== "string") {
            console.error("Invalid path type:", path);
            throw new functions.https.HttpsError("invalid-argument", "Path must be a string.");
        }

        if (!path.startsWith(`temp/${userId}/`)) {
            throw new functions.https.HttpsError("permission-denied", "Invalid file path.");
        }

        const tempFile = bucket.file(path);
        const fileName = path.split("/").pop();
        const destPath = `event_images/${eventId}/${fileName}`;

        await validateUploadedFile(path, "image", 5 * 1024 * 1024);
        await tempFile.move(destPath);
        await bucket.file(destPath).makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
        finalImageUrls.push(publicUrl);

        if (selectedThumbnail && name === selectedThumbnail) {
            thumbnailUrl = publicUrl;
        }
    }

    if (!thumbnailUrl && finalImageUrls.length > 0) {
        thumbnailUrl = finalImageUrls[0];
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid event date.");
    }

    await eventRef.set({
        title,
        title_lower: title.toLowerCase(),
        description,
        date: Timestamp.fromDate(eventDate),
        time,
        endTime,
        eventType,
        location,
        maxParticipants: parsedMax,
        images: finalImageUrls,
        thumbnail: thumbnailUrl,
        createdBy: userId,
        createdAt: Timestamp.now(),
        attendees: []
    });

    return { message: "Event created successfully", eventId };
});

// Delete Event
exports.deleteEvent = functions.https.onCall(async (data, context) => {
    const authInfo = context.auth || data.auth;
    if (!authInfo) {
        throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const { eventId } = data.data || data;
    if (!eventId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing eventId");
    }

    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();

    if (!eventSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Event does not exist");
    }

    const eventData = eventSnap.data();
    if (eventData.createdBy !== authInfo.uid) {
        throw new functions.https.HttpsError("permission-denied", "You are not the creator of this event");
    }

    const bucket = admin.storage().bucket();
    const prefix = `event_images/${eventId}/`;

    try {
        const [files] = await bucket.getFiles({ prefix });

        const deleteOps = files.map(file =>
            file.delete().catch(err => {
                console.warn(`Failed to delete ${file.name}:`, err.message);
            })
        );

        await Promise.all(deleteOps);
        await eventRef.delete();

        return { message: "Event deleted successfully" };
    } catch (error) {
        console.error("Error deleting event:", error);
        throw new functions.https.HttpsError("internal", "Failed to delete event");
    }
});

exports.syncLikesCount = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        const postsSnap = await db.collection('content-posts').get();
        const batch = db.batch();

        for (const postDoc of postsSnap.docs) {
            const postId = postDoc.id;
            const likesSnap = await db
                .collection('content-posts')
                .doc(postId)
                .collection('likes')
                .get();

            const newCount = likesSnap.size;
            const postRef = postDoc.ref;
            batch.update(postRef, { likesCount: newCount });
        }

        // commit all updates in one go
        await batch.commit();
        console.log(`Synced likesCount for ${postsSnap.size} posts.`);
        return null;
    });

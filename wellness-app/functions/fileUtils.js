const admin = require("firebase-admin");
const fetch = require("node-fetch");

const MAX_FILE_SIZES = {
    video: 300 * 1024 * 1024, // 300 MB
    audio: 100 * 1024 * 1024, // 100 MB
    image: 10 * 1024 * 1024,  // 10 MB
};

const allowedExtensions = {
    video: ["mp4"],
    audio: ["mp3", "wav"],
    image: ["jpg", "jpeg", "png", "bmp"],
};

const allowedMimeTypes = {
    video: ["video/mp4"],
    audio: ["audio/mpeg", "audio/wav"],
    image: ["image/jpeg", "image/png"],
};

const validSignatures = {
    mp4: [["00", "00", "00"], ["66", "74", "79", "70"]],
    mp3: [["49", "44", "33"]],
    wav: [["52", "49", "46", "46"]],
    jpg: [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
    jpeg: [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
    png: [["89", "50", "4e", "47"]],
};

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

async function fetchHeaderBytes(url, length) {
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Range: `bytes=0-${length - 1}`
        }
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Validate an uploaded file stored in Firebase Storage by checking metadata and file header.
 * 
 * @param {object} file - Firebase Storage file object
 * @param {string} type - One of: "video", "audio", "image"
 * @param {number} [customMaxSize] - Optional max size in bytes (overrides default)
 */
const axios = require("axios");

async function validateUploadedFile(filePath, type, customMaxSize) {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    const fileName = metadata.name;
    const mimeType = metadata.contentType;
    const ext = fileName.split('.').pop().toLowerCase();

    const sizeLimit = customMaxSize || MAX_FILE_SIZES[type];
    if (metadata.size > sizeLimit) {
        throw new Error(`File exceeds allowed size of ${sizeLimit} bytes`);
    }
    const allowedExts = allowedExtensions[type] || [];
    const allowedMimes = allowedMimeTypes[type] || [];
    if (!allowedExts.includes(ext)) throw new Error("Invalid extension");
    if (!allowedMimes.includes(mimeType)) throw new Error("Invalid MIME type");

    // Generate signed URL for safe public read
    const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 5 * 60 * 1000,
    });

    // Download only first 16 bytes
    const response = await axios.get(signedUrl, {
        responseType: "arraybuffer",
        headers: { Range: "bytes=0-15" }
    });

    const sig = Array.from(new Uint8Array(response.data)).map(b => b.toString(16).padStart(2, "0"));
    const patterns = validSignatures[ext] || [];

    const isValidSig = patterns.some(pattern => sig.slice(0, pattern.length).join("") === pattern.join(""));
    if (!isValidSig) throw new Error("Invalid file signature");

    return true;
}

module.exports = {
    validateUploadedFile,
    MAX_FILE_SIZES
};

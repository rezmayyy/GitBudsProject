// validate and upload files (no React/UI code)
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const MAX_FILE_SIZES = {
    video: 300 * 1024 * 1024,
    audio: 100 * 1024 * 1024,
    image: 10 * 1024 * 1024
};

const allowedExtensions = {
    video: ["mp4"],
    audio: ["mp3", "wav"],
    image: ["jpg", "jpeg", "png", "bmp"]
};

const allowedMimeTypes = {
    video: ["video/mp4"],
    audio: ["audio/mpeg", "audio/wav"],
    image: ["image/jpeg", "image/png"]
};

const validSignatures = {
    mp4: [["00", "00", "00"], ["66", "74", "79", "70"]],
    mp3: [["49", "44", "33"]],
    wav: [["52", "49", "46", "46"]],
    jpg: [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
    jpeg: [["ff", "d8", "ff", "e0"], ["ff", "d8", "ff", "e1"]],
    png: [["89", "50", "4e", "47"]]
};

export async function validateFile(file, type) {
    if (!file) return false;
    if (file.size > MAX_FILE_SIZES[type]) {
        alert(`File exceeds ${MAX_FILE_SIZES[type] / 1024 / 1024}MB`);
        return false;
    }
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions[type].includes(ext) || !allowedMimeTypes[type].includes(file.type)) {
        alert("Invalid file type/extension.");
        return false;
    }
    const buf = await file.arrayBuffer();
    const sig = Array.from(new Uint8Array(buf.slice(0, 12)), b => b.toString(16).padStart(2, "0"));
    return validSignatures[ext]?.some(pattern => sig.slice(0, pattern.length).join("") === pattern.join("")) || (alert("Invalid file signature."), false);
}

export async function uploadFileToStorage(file, folder) {
    if (!file) return null;
    const storage = getStorage();
    const path = `${folder}/${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return path; // ✅ Return raw path, NOT download URL
}
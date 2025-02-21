import React, { useState } from 'react';
import { db, auth, storage } from '../Firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

function CreateEventPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [images, setImages] = useState([]); // Store selected images
    const [uploading, setUploading] = useState(false);
    const [thumbnail, setThumbnail] = useState(null); // Selected thumbnail
    const navigate = useNavigate();

    const DEFAULT_THUMBNAIL = '../Logo.png'; // Replace with actual Firebase Storage URL. nah we hardcoding 

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        setImages((prevImages) => {
            const newImages = [...prevImages, ...selectedFiles].slice(0, 5); // Append new images while keeping max 5
            return newImages;
        });

        setThumbnail(null); // Reset thumbnail selection when new images are uploaded
    };

    const handleRemoveImage = (index) => {
        setImages((prevImages) => {
            const updatedImages = prevImages.filter((_, i) => i !== index);
            return updatedImages;
        });

        // Reset thumbnail if the removed image was set as the thumbnail
        if (thumbnail && images[index] === thumbnail) {
            setThumbnail(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            const now = new Date();
            now.setSeconds(0, 0);

            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);
            const eventDateTime = new Date(year, month - 1, day, hours, minutes, 0);

            if (eventDateTime <= now) {
                alert("Event date and time must be in the future.");
                setUploading(false);
                return;
            }

            const eventRef = doc(collection(db, 'events'));
            const eventId = eventRef.id;
            const imageUrls = [];
            let thumbnailUrl = DEFAULT_THUMBNAIL;

            for (const image of images) {
                const imageRef = ref(storage, `event_images/${eventId}/${uuidv4()}_${image.name}`);
                await uploadBytes(imageRef, image);
                const imageUrl = await getDownloadURL(imageRef);
                imageUrls.push(imageUrl);

                if (thumbnail && image.name === thumbnail.name) {
                    thumbnailUrl = imageUrl;
                }
            }

            const parsedMaxParticipants = maxParticipants === "" ? -1 : parseInt(maxParticipants);

            await setDoc(eventRef, {
                title,
                description,
                date: eventDateTime,
                time,
                location,
                maxParticipants: parsedMaxParticipants,
                images: imageUrls,
                thumbnail: thumbnailUrl,
                createdBy: auth.currentUser?.uid || 'anonymous',
                createdAt: serverTimestamp(),
                attendees: []
            });

            alert('Event Created Successfully!');
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            setLocation('');
            setMaxParticipants('');
            setImages([]);
            setThumbnail(null);
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event.');
        } finally {
            setUploading(false);
        }
    };


    return (
        <div>
            <button
                onClick={() => navigate("/events")}
                style={{
                    marginBottom: "15px",
                    padding: "8px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                }}
            >
                ← Back to Events
            </button>

            <h1>Create Event</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                <input type="text" placeholder="Location (Address or Zoom Link)" value={location} onChange={(e) => setLocation(e.target.value)} required />
                <input
                    type="number"
                    placeholder="Max Participants (leave empty for unlimited)"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Math.max(0, parseInt(e.target.value) || ''))}
                    min="1"
                />


                {/* File input for images */}
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                <p>Selected {images.length} image(s) (Max: 5)</p>

                {/* Thumbnail selection (only show if images were uploaded) */}
                {images.length > 0 && (
                    <div>
                        <h3>Selected Images</h3>
                        {images.map((image, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                                <input
                                    type="radio"
                                    name="thumbnail"
                                    checked={thumbnail && thumbnail.name === image.name}
                                    onChange={() => setThumbnail(image)}
                                    style={{ marginRight: "10px" }}
                                />
                                <img
                                    src={URL.createObjectURL(image)}
                                    alt="Selected preview"
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        objectFit: "cover",
                                        marginRight: "10px",
                                        border: thumbnail && thumbnail.name === image.name ? "3px solid blue" : "1px solid gray",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => setThumbnail(image)}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    style={{
                                        background: "none",
                                        border: "1px solid gray",
                                        color: "gray",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                        borderRadius: "5px",
                                        fontSize: "14px",
                                        width: "100px"
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}



                <button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Create Event'}</button>
            </form>
        </div>
    );
}

export default CreateEventPage;

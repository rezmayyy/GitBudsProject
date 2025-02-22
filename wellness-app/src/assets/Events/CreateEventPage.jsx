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
    const [endTime, setEndTime] = useState('');
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
            const [startHours, startMinutes] = time.split(':').map(Number);
            const [endHours, endMinutes] = endTime.split(':').map(Number);

            const eventDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
            const eventEndDateTime = new Date(year, month - 1, day, endHours, endMinutes, 0);

            if (eventDateTime <= now) {
                alert("Event start time must be in the future.");
                setUploading(false);
                return;
            }

            if (eventEndDateTime <= eventDateTime) {
                alert("End time must be after start time.");
                setUploading(false);
                return;
            }

            const eventRef = doc(collection(db, 'events'));
            const eventId = eventRef.id; // Get the generated event ID
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
                title_lower: title.toLowerCase(),
                description,
                date: eventDateTime,
                time,
                endTime,
                location,
                maxParticipants: parsedMaxParticipants,
                images: imageUrls,
                thumbnail: thumbnailUrl,
                createdBy: auth.currentUser?.uid || 'anonymous',
                createdAt: serverTimestamp(),
                attendees: []
            });

            alert('Event Created Successfully!');

            // Redirect user to the newly created event's details page
            navigate(`/events/${eventId}`);

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
                <fieldset>
                    <legend>Event Details</legend>

                    <div>
                        <label htmlFor="title">Title: </label>
                        <input
                            type="text"
                            id="title"
                            maxLength="100"
                            placeholder="Title (Max: 100)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <small>{title.length}/100</small>
                    </div>

                    <div>
                        <label htmlFor="description">Description: </label>
                        <textarea
                            id="description"
                            maxLength="1000"
                            placeholder="Description (Max: 1000)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <small>{description.length}/1000</small>
                    </div>

                    <div>
                        <label htmlFor="date">Date: </label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div>
                        <label htmlFor="time">Time: </label>
                        <input
                            type="time"
                            id="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="endTime">End Time: </label>
                        <input
                            type="time"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="location">Location: </label>
                        <input
                            type="text"
                            id="location"
                            maxLength="200"
                            placeholder="Location (Address or Zoom Link (Max: 200))"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                        <small>{location.length}/200</small>
                    </div>

                    <div>
                        <label htmlFor="maxParticipants">Max Participants: </label>
                        <input
                            type="number"
                            id="maxParticipants"
                            placeholder="Max Participants (leave empty for unlimited)"
                            value={maxParticipants}
                            onChange={(e) => {
                                const value = e.target.value;
                                setMaxParticipants(value === '' ? '' : Math.max(1, parseInt(value) || 1));
                            }}
                            min="1"
                        />

                    </div>

                    <div>
                        <label htmlFor="eventImages">Upload event images: </label>
                        <input
                            type="file"
                            id="eventImages"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <p>Selected {images.length} image(s) (Max: 5)</p>
                    </div>

                    {images.length > 0 && (
                        <div>
                            <h3>Selected Images</h3>
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}
                                >
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

                    <button type="submit" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Create Event'}
                    </button>
                </fieldset>
            </form>

        </div>
    );

}

export default CreateEventPage;

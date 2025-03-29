import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../Firebase';
import { validateFile, uploadFileToStorage } from '../../Utils/fileUtils';

function CreateEventPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [eventType, setEventType] = useState("Local Gathering");
    const EVENT_TYPES = ["Local Gathering", "Workshop", "Retreat", "Webinar"];
    const [location, setLocation] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [thumbnail, setThumbnail] = useState(null);
    const navigate = useNavigate();

    const DEFAULT_THUMBNAIL = '../Logo.png';


    const createEvent = httpsCallable(functions, 'createEvent');

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setImages((prevImages) => {
            const newImages = [...prevImages, ...selectedFiles].slice(0, 5);
            return newImages;
        });
        setThumbnail(null);
    };

    const handleRemoveImage = (index) => {
        setImages((prevImages) => {
            const updatedImages = prevImages.filter((_, i) => i !== index);
            return updatedImages;
        });
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

            const userId = auth.currentUser?.uid;
            const tempFolder = `temp/${userId}`;
            const tempPaths = [];

            for (const image of images) {
                const isValid = await validateFile(image, "image");
                if (!isValid) {
                    alert("Invalid file format or size.");
                    setUploading(false);
                    return;
                }
                const fullPath = await uploadFileToStorage(image, tempFolder);

                tempPaths.push({ name: image.name, path: fullPath });
            }

            const parsedMax = maxParticipants === "" ? -1 : parseInt(maxParticipants);
            const selectedThumbnail = thumbnail?.name || null;

            const payload = {
                title,
                description,
                date,
                time,
                endTime,
                eventType,
                location,
                maxParticipants: parsedMax,
                tempImages: tempPaths,
                selectedThumbnail,
            };

            const response = await createEvent(payload);
            const eventId = response.data.eventId;
            alert('Event Created Successfully!');
            navigate(`/events/${eventId}`);
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="create-event-page">
            <button onClick={() => navigate("/events")} className="back-button">
                ← Back to Events
            </button>

            <h1 className="create-event-title">Create Event</h1>
            <form onSubmit={handleSubmit} className="create-event-form">
                <fieldset className="event-fieldset">
                    <legend className="event-legend">Event Details</legend>

                    <div className="form-group">
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
                        <small className="char-count">{title.length}/100</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description: </label>
                        <textarea
                            id="description"
                            maxLength="1000"
                            placeholder="Description (Max: 1000)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                        <small className="char-count">{description.length}/1000</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date: </label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="time">Time: </label>
                        <input
                            type="time"
                            id="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endTime">End Time: </label>
                        <input
                            type="time"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="eventType">Event Type: </label>
                        <select
                            id="eventType"
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            required
                        >
                            {EVENT_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
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
                        <small className="char-count">{location.length}/200</small>
                    </div>

                    <div className="form-group">
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

                    <div className="form-group">
                        <label htmlFor="eventImages">Upload event images: </label>
                        <input
                            type="file"
                            id="eventImages"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        <p className="image-count">Selected {images.length} image(s) (Max: 5)</p>
                    </div>

                    {images.length > 0 && (
                        <div className="image-preview-container">
                            <h3>Choose Thumbnail</h3>
                            <div className="image-preview-container-images">
                                {images.map((image, index) => (
                                    <div key={index} className="image-preview">
                                        <input
                                            type="radio"
                                            name="thumbnail"
                                            checked={thumbnail && thumbnail.name === image.name}
                                            onChange={() => setThumbnail(image)}
                                        />
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt="Selected preview"
                                            className={`thumbnail-preview ${thumbnail && thumbnail.name === image.name ? 'selected-thumbnail' : ''}`}
                                            onClick={() => setThumbnail(image)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="remove-image-button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="submit-button" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Create Event'}
                    </button>
                </fieldset>
            </form>
        </div>
    );
}

export default CreateEventPage;

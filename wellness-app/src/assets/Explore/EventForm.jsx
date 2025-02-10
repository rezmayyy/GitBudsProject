import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../Firebase';
import { getAuth } from 'firebase/auth';

function EventForm({ setEvents }) {
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });

    const handleInputChange = (e) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return alert('You must be logged in to create events.');

        try {
            await addDoc(collection(db, 'calendar-events'), {
                ...newEvent,
                createdBy: user.uid,
                createdByName: user.displayName || 'Anonymous',
            });
            alert('Event added successfully!');
            setNewEvent({ title: '', description: '', date: '' });
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    return (
        <form onSubmit={handleAddEvent} className="event-form">
            <h3>Create New Event</h3>
            <input type="text" name="title" value={newEvent.title} placeholder="Event Title" onChange={handleInputChange} required />
            <textarea name="description" value={newEvent.description} placeholder="Event Description" onChange={handleInputChange} required />
            <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} required />
            <button type="submit">Add Event</button>
        </form>
    );
}

export default EventForm;

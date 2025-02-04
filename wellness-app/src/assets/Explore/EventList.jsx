import React from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../Firebase';
import { getAuth } from 'firebase/auth';
import { format, parseISO } from 'date-fns';

function EventList({ loggedIn, events, setEvents }) {
    const handleDeleteEvent = async (eventId) => {
        if (!loggedIn) return alert('You must be logged in to delete events.');

        try {
            await deleteDoc(doc(db, 'calendar-events', eventId));
            setEvents(events.filter(event => event.id !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    return loggedIn ? events.map(event => (
        <div key={event.id} className="event-item">
            <h4>{event.title}</h4>
            <p>{event.description}</p>
            <p><strong>Date:</strong> {format(parseISO(event.date), 'MM/dd/yyyy')}</p>
            <button onClick={() => handleDeleteEvent(event.id)}>Delete</button>
        </div>
    )) : <p>Log in to see upcoming events.</p>;
}

export default EventList;

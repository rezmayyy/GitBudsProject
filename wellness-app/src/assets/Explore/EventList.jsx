import React, { useEffect, useState } from 'react';
import { deleteDoc, doc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

function EventList({ loggedIn, setEvents }) {
    const [events, setInternalEvents] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const fetchEvents = async () => {
            try {
                const q = query(collection(db, 'calendar-events'), orderBy('date', 'asc'));
                const snapshot = await getDocs(q);
                let eventData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                console.log("Fetched Events (Raw from Firebase):", eventData);

                const today = startOfDay(new Date());
                console.log("Today's Date:", today.toISOString());

                eventData = eventData.filter(event => {
                    const eventDate = startOfDay(new Date(event.date));
                    console.log("Event:", event.title, "| Event Date:", eventDate.toISOString());

                    return !isBefore(eventDate, today);
                });

                console.log("Final Filtered Events:", eventData);
                setInternalEvents(eventData);
                setEvents(eventData);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        fetchEvents();

        return () => unsubscribe();
    }, [setEvents]);

    const handleDeleteEvent = async (eventId) => {
        if (!user) return alert('You must be logged in to delete events.');

        try {
            await deleteDoc(doc(db, 'calendar-events', eventId));
            setInternalEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    return (
        <div className="event-list-container">
            <h3>Upcoming Events</h3>
            <div className="event-list">
                {events.slice(0, 5).map(event => (
                    <div key={event.id} className="event-item">
                        <h4>{event.title}</h4>
                        <p>{event.description}</p>
                        <p><strong>Date:</strong> {format(parseISO(event.date), 'MM/dd/yyyy')}</p>
                        <p><strong>Created by:</strong> {event.createdByName}</p>
                        {user?.uid === event.createdBy && (
                            <button className="delete-button" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EventList;

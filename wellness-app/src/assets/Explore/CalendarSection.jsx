import React, { useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../Firebase';
import EventForm from './EventForm';
import EventList from './EventList';

function CalendarSection({ loggedIn, events, setEvents }) {
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const q = query(collection(db, 'calendar-events'), orderBy('date', 'asc'));
                const snapshot = await getDocs(q);
                setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        fetchEvents();
    }, []);

    return (
        <div className="calendar-section">
            <Calendar />
            {loggedIn && <EventForm setEvents={setEvents} />}
            <EventList loggedIn={loggedIn} events={events} setEvents={setEvents} />
        </div>
    );
}

export default CalendarSection;

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './Firebase';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getAuth } from 'firebase/auth';
import '../styles/ExplorePage.css';
import { parseISO, format } from 'date-fns';

function ExplorePage() {
    const [videos, setVideos] = useState([]);
    const [audios, setAudios] = useState([]);
    const [texts, setTexts] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });
    const [loggedIn, setLoggedIn] = useState(false); // Track if the user is logged in

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        setLoggedIn(!!user); // Update login status based on currentUser

        // Fetch content (videos, audios, texts)
        const fetchContent = async () => {
            const videoQuery = query(collection(db, 'content-posts'), where('type', '==', 'video'));
            const videoSnapshot = await getDocs(videoQuery);
            const videoList = videoSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setVideos(videoList);

            const audioQuery = query(collection(db, 'content-posts'), where('type', '==', 'audio'));
            const audioSnapshot = await getDocs(audioQuery);
            const audioList = audioSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAudios(audioList);

            const textQuery = query(collection(db, 'content-posts'), where('type', '==', 'article'));
            const textSnapshot = await getDocs(textQuery);
            const textList = textSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTexts(textList);
        };

        fetchContent();
        fetchEvents();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent({ ...newEvent, [name]: value });
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('You must be logged in to create events.');
            return;
        }

        const currentDate = new Date();
        const selectedDate = new Date(newEvent.date);
        currentDate.setHours(0, 0, 0, 0);

        if (selectedDate < currentDate) {
            alert('Event date cannot be in the past.');
            return;
        }

        try {
            await addDoc(collection(db, 'calendar-events'), {
                ...newEvent,
                createdBy: user.uid,
                createdByName: user.displayName || "Anonymous",
            });

            alert('Event added successfully!');
            setNewEvent({ title: '', description: '', date: '' });
            fetchEvents();
        } catch (error) {
            console.error('Error adding event:', error);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('You must be logged in to delete events.');
            return;
        }

        const eventToDelete = events.find(event => event.id === eventId);
        if (!eventToDelete) {
            alert('Event not found.');
            return;
        }

        if (eventToDelete.createdBy !== user.uid) {
            alert('You can only delete events you created.');
            return;
        }

        try {
            await deleteDoc(doc(db, 'calendar-events', eventId));
            alert('Event deleted successfully!');
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const eventsQuery = query(collection(db, 'calendar-events'), orderBy('date', 'asc'));
            const eventsSnapshot = await getDocs(eventsQuery);
            const eventList = eventsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setEvents(eventList);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleScroll = (event, sectionId) => {
        event.preventDefault();
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="explore-page">
            <div className="intro-section">
                <h1>Welcome to the Explore Page</h1>
                <p>Here you can explore a variety of content including videos, audio, and articles. Click on any of the sections below to jump straight to that content.</p>
                <ul className="explore-links">
                    <li><a href="#videos" onClick={(e) => handleScroll(e, 'videos')}>Videos</a></li>
                    <li><a href="#audios" onClick={(e) => handleScroll(e, 'audios')}>Audios</a></li>
                    <li><a href="#texts" onClick={(e) => handleScroll(e, 'texts')}>Articles</a></li>
                    <li>
                        <button onClick={() => setShowCalendar(!showCalendar)}>Calendar</button>
                    </li>
                </ul>
            </div>

            {/* Always show the Calendar */}
            {showCalendar && (
                <div className="calendar-section">
                    <Calendar />
                    
                    {/* Show the event creation form only if the user is logged in */}
                    {loggedIn && (
                        <form onSubmit={handleAddEvent} className="event-form">
                            <h3>Create New Event</h3>
                            <input
                                type="text"
                                name="title"
                                value={newEvent.title}
                                placeholder="Event Title"
                                onChange={handleInputChange}
                                required
                            />
                            <textarea
                                name="description"
                                value={newEvent.description}
                                placeholder="Event Description"
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="date"
                                name="date"
                                value={newEvent.date}
                                onChange={handleInputChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <button type="submit">Add Event</button>
                        </form>
                    )}

                    {/* Show upcoming events only if the user is logged in */}
                    {loggedIn && (
                        <div className="event-list">
                            <h3>Upcoming Events</h3>
                            {events.map((event) => (
                                <div key={event.id} className="event-item">
                                    <h4>{event.title}</h4>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {format(parseISO(event.date), 'MM/dd/yyyy')}</p>
                                    <p><strong>Created By:</strong> {event.createdByName}</p>
                                    {getAuth().currentUser?.uid === event.createdBy && (
                                        <button className="delete-button" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* If not logged in, show a message for the events section */}
                    {!loggedIn && (
                        <p>Log in to see upcoming events.</p>
                    )}
                </div>
            )}

            {/* Display other content sections */}
            <div className="content-section videos">
                <h2 id="videos">Videos</h2>
                <div className="content-list">
                    {videos.map(video => (
                        <div key={video.id} className="content-item">
                            <Link to={`/content/${video.id}`}>
                                <img src={video.thumbnailURL || logo} alt={video.title} />
                                <h3>{video.title}</h3>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div className="content-section audios">
                <h2 id="audios">Audios</h2>
                <div className="content-list">
                    {audios.map(audio => (
                        <div key={audio.id} className="content-item">
                            <Link to={`/content/${audio.id}`}>
                                <img src={audio.thumbnailURL} alt={audio.title} />
                                <h3>{audio.title}</h3>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            <div className="content-section texts">
                <h2 id="texts">Articles</h2>
                <div className="content-list">
                    {texts.map(text => (
                        <div key={text.id} className="content-item">
                            <Link to={`/content/${text.id}`}>
                                <img src={text.thumbnailURL || logo} alt={text.title} />
                                <h3>{text.title}</h3>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ExplorePage;

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { getAuth } from 'firebase/auth';
import '../../styles/ExplorePage.css';
import ContentSection from './ContentSection';
import CalendarSection from './CalendarSection';
import { Link } from 'react-router-dom';


function ExplorePage() {
    const [videos, setVideos] = useState([]);
    const [audios, setAudios] = useState([]);
    const [texts, setTexts] = useState([]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [events, setEvents] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        setLoggedIn(!!auth.currentUser);

        const fetchContent = async () => {
            const fetchData = async (type) => {
                const q = query(collection(db, 'content-posts'), where('status', '==', 'approved'), where('type', '==', type));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            };

            setVideos(await fetchData('video'));
            setAudios(await fetchData('audio'));
            setTexts(await fetchData('article'));
        };

        fetchContent();
    }, []);

    return (
        <div className="explore-page">

            <h1>Welcome to the Explore Page</h1>
            <p>Explore videos, audio, and articles below.</p>


            <ScrollNavigation toggleCalendar={() => setShowCalendar(!showCalendar)} />

            {showCalendar && <CalendarSection loggedIn={loggedIn} events={events} setEvents={setEvents} />}

            <ContentSection id="videos" title="Videos" content={videos} />
            <ContentSection id="audios" title="Audios" content={audios} />
            <ContentSection id="texts" title="Articles" content={texts} />

        </div>
    );
}

/* Scrolling function thing. When clicking on tab, page scrolls */
function ScrollNavigation({ toggleCalendar }) {
    const handleScroll = (event, sectionId) => {
        event.preventDefault();
        document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <ul className="explore-links">
            <li><a href="#videos" onClick={(e) => handleScroll(e, 'videos')}>Videos</a></li>
            <li><a href="#audios" onClick={(e) => handleScroll(e, 'audios')}>Audios</a></li>
            <li><a href="#texts" onClick={(e) => handleScroll(e, 'texts')}>Articles</a></li>
           {/* <li><button onClick={toggleCalendar}>Calendar</button></li> */}  {/*Ill comment out my hardwork on the calendar for now */}
            <li><Link to="/events"><button>Events</button></Link></li>
        </ul>
    );
}

export default ExplorePage;

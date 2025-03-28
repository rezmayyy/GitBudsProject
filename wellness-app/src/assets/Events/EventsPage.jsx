import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, orderBy, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../Firebase";
import { Container, Row, Col } from 'react-bootstrap';
import logo from '../Logo.png';
import frame1 from './frame1.png';
import frame2 from './frame2.png';
import EventSearch from "./EventSearch";
import styles from "../../styles/Events.css";

const defaultThumbnail = logo;

function formatToLocalTime(utcDate) {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(utcDate);
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + "... (View Details to see more)" : text;
}

function isValidUrl(url) {
    return url && typeof url === "string" && url.startsWith("http");
}

function getThumbnail(event) {
    if (isValidUrl(event.thumbnail)) return event.thumbnail;
    if (Array.isArray(event.images) && event.images.length > 0 && isValidUrl(event.images[0])) {
        return event.images[0];
    }
    return defaultThumbnail;
}

function EventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [displayedEvents, setDisplayedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const now = new Date();
                now.setSeconds(0, 0);

                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayTimestamp = Timestamp.fromDate(todayStart);

                const eventsRef = collection(db, "events");
                const q = query(
                    eventsRef,
                    where("date", ">=", todayTimestamp),
                    orderBy("date", "asc")
                );

                const querySnapshot = await getDocs(q);
                const eventsList = querySnapshot.docs.map(doc => {
                    const event = doc.data();
                    const eventDate = event.date.toDate();

                    return {
                        id: doc.id,
                        ...event,
                        titleLower: event.title ? event.title.toLowerCase() : "",
                        date: eventDate,
                        localTime: formatToLocalTime(eventDate),
                        endTimeFormatted: event.endTime
                            ? formatToLocalTime(new Date(`${eventDate.toISOString().split("T")[0]}T${event.endTime}`))
                            : null,
                        thumbnail: getThumbnail(event),
                    };
                });

                setEvents(eventsList);
                setDisplayedEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    const scrollToUpcomingEvents = () => {
        const section = document.getElementById("upcoming-events");
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }
    };


    return (
        <div className="events-page mt-5">
            <style>
                {`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                `}
            </style>

            <div className="information-box" style={{
                opacity: 0,
                transform: 'translateY(20px)',
                animation: 'fadeIn 1s ease-out forwards'
            }}>
                <div className="title-box">
                    <h1 className="event-page-title">EVENTS & WORKSHOPS</h1>
                </div>
                <div className="healing-connect">
                    <h2 className="experience-healing">Experience Healing,</h2>
                    <h2 className="learn-connect">Learn, and Connect</h2>
                </div>
                <div className="d-flex justify-content-center">
                    <p className="description">
                        Attend workshops, retreats, and webinars that honor your cultural and spiritual journey.
                    </p>
                </div>
                <div className="buttons">
                    <button className="upcoming-events mb-5" onClick={scrollToUpcomingEvents}>
                        See Upcoming Events
                    </button>
                    <Link to="/create-event">
                        <button className="host-event">Host an Event</button>
                    </Link>
                </div>
            </div>

            <div className="picture-container mt-5 justify-content-center">
                <div className="row justify-content-center">
                    <div className="col-md-6 image-container position-relative d-flex justify-content-center">
                        <img
                            src={frame1}
                            alt="Pic 1"
                            className="img-fluid position-absolute"
                            style={{ top: "0px", left: "25%", transform: "translateX(-50%)", zIndex: 2 }} />
                        <img
                            src={frame2}
                            alt="Pic 2"
                            className="img-fluid position-absolute"
                            style={{ top: "30px", left: "75%", transform: "translateX(-50%)", zIndex: 1 }}
                        />
                    </div>
                </div>
            </div>

            <Container className="event-categories my-5">
                <h2 className="categories-title mb-3">Event Categories</h2>
                <p className="categories-subtitle">
                    Foster meaningful conversations around holistic healing practices, cultural roots, and shared experiences.
                </p>
                <Row className="justify-content-center gy-4">
                    <Col md={6} lg={6} className="d-flex">
                        <div className="category-box">
                            <h3 className="category-title">Local Gatherings</h3>
                            <p className="category-description">
                                Connect with like-minded individuals in your community for shared experiences and growth.
                            </p>
                        </div>
                    </Col>
                    <Col md={6} lg={6} className="d-flex">
                        <div className="category-box">
                            <h3 className="category-title">Cultural Healing Workshops</h3>
                            <p className="category-description">
                                Connecting ancestral traditions with modern practices.
                            </p>
                        </div>
                    </Col>
                    <Col md={6} lg={6} className="d-flex">
                        <div className="category-box">
                            <h3 className="category-title">Holistic Healing Retreats</h3>
                            <p className="category-description">
                                Escape, rejuvenate, and reconnect with yourself in serene settings.
                            </p>
                        </div>
                    </Col>
                    <Col md={6} lg={6} className="d-flex">
                        <div className="category-box">
                            <h3 className="category-title">Expert-Led Webinars</h3>
                            <p className="category-description">
                                Insights from globally recognized healers and coaches.
                            </p>
                        </div>
                    </Col>
                </Row>
            </Container>

            <div id="upcoming-events" className="event-search-container">
                <EventSearch events={events} setFilteredEvents={setDisplayedEvents} />
            </div>

            <div id="upcoming-events" className="upcoming-events-section">
                <h1 className="events-title">Upcoming Events.</h1>
                <button className="create-event-button" onClick={() => navigate("/create-event")}>
                    Create Event
                </button>
                {loading ? (
                    <div className="loading-message">
                        <p>Loading...</p>
                    </div>
                ) : displayedEvents.length === 0 ? (
                    <div className="no-events-message">
                        <p>No events found.</p>
                    </div>
                ) : (
                    <ul className="events-list">
                        {displayedEvents.map(event => (
                            <li key={event.id} className="event-card mt-3">
                                <img
                                    className="event-thumbnail"
                                    src={event.thumbnail}
                                    alt="Event Thumbnail"
                                    onError={(e) => { e.target.onerror = null; e.target.src = defaultThumbnail; }}
                                />
                                <div className="event-info">
                                    <div className="event-info-no-title">
                                        <p className="event-type">{event.eventType || "Not specified"}</p>
                                        <h3 className="event-title">{event.title} </h3>
                                        <p className="event-date">{event.date instanceof Date ? event.date.toLocaleDateString() : "Invalid Date"} ~ {event.localTime} {event.endTime ? ` to ${event.endTimeFormatted}` : ""}</p>
                                        <p className="event-description">{/*{truncateText(*/}{event.description}{/*}, 100)}*/}</p>
                                        <p className="event-location"><strong>Location:</strong> {event.location}</p>
                                        <button className="event-details-button" onClick={() => navigate(`/events/${event.id}`)}>
                                            Register Now
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

            </div>
        </div>

    );
}

export { formatToLocalTime };
export default EventsPage;

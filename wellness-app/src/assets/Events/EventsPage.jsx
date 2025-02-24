import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../Firebase";
import logo from '../Logo.png';
import EventSearch from "./EventSearch";
import Events from "./Events.css";

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
    const [filteredEvents, setFilteredEvents] = useState([]);
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
                        titleLower: event.title ? event.title.toLowerCase() : "", // Ensure titleLower is always defined
                        date: eventDate,
                        localTime: formatToLocalTime(eventDate),
                        endTimeFormatted: event.endTime
                            ? formatToLocalTime(new Date(`${eventDate.toISOString().split("T")[0]}T${event.endTime}`))
                            : null,
                        thumbnail: getThumbnail(event),
                    };

                });

                setEvents(eventsList);
                setFilteredEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    return (
        <div className="events-page">

            <div className="event-search-container">
                <EventSearch events={events} setFilteredEvents={setFilteredEvents} />
            </div>

            <h1 className="events-title">Upcoming Events</h1>
            <button className="create-event-button" onClick={() => navigate("/create-event")}>
                Create Event
            </button>

            <div className="events-list-container">
                {loading ? (
                    <div className="loading-message">
                        <p>Loading...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="no-events-message">
                        <p>No events found.</p>
                    </div>
                ) : (
                    <ul className="events-list">
                        {filteredEvents.map(event => (
                            <li key={event.id} className="event-item">
                                <img
                                    className="event-thumbnail"
                                    src={event.thumbnail}
                                    alt="Event Thumbnail"
                                    onError={(e) => { e.target.onerror = null; e.target.src = defaultThumbnail; }}
                                />
                                <div className="event-info">
                                    <h2 className="event-title">{event.title}</h2>
                                    <div className="event-info-no-title">
                                        <p className="event-description">{truncateText(event.description, 100)}</p>
                                        <p className="event-date"><strong>Date:</strong> {event.date instanceof Date ? event.date.toLocaleDateString() : "Invalid Date"}</p>
                                        <p className="event-time"><strong>Time:</strong> {event.localTime} {event.endTime ? ` - ${event.endTimeFormatted}` : ""}</p>
                                        <p className="event-type"><strong>Event Type:</strong> {event.eventType || "Not specified"}</p>
                                        <p className="event-location"><strong>Location:</strong> {event.location}</p>
                                        <button className="event-details-button" onClick={() => navigate(`/events/${event.id}`)}>
                                            View Details
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

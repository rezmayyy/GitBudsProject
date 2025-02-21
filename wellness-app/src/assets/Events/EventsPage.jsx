import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../Firebase";
import logo from '../Logo.png'; // Ensure the correct path and case

const defaultThumbnail = logo; // Store the imported logo directly

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

// Utility function to check if the URL is valid
function isValidUrl(url) {
    return url && typeof url === "string" && url.startsWith("http");
}

// Function to determine which thumbnail to use
function getThumbnail(event) {
    if (isValidUrl(event.thumbnail)) {
        return event.thumbnail;
    } 
    
    if (Array.isArray(event.images) && event.images.length > 0 && isValidUrl(event.images[0])) {
        return event.images[0]; // Use the first valid image from event.images array
    }
    
    console.warn(`Event "${event.title}" missing valid thumbnail. Using default.`);
    return defaultThumbnail;
}

function EventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
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
                    const eventDate = event.date.toDate(); // Convert Firestore Timestamp to Date

                    const eventTimeString = `${eventDate.toDateString()} ${event.time}`;
                    const eventDateTime = new Date(eventTimeString);

                    return {
                        id: doc.id,
                        ...event,
                        date: eventDate,
                        localTime: formatToLocalTime(eventDateTime),
                        thumbnail: getThumbnail(event), // Assign validated thumbnail
                    };
                });

                setEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    return (
        <div>
            <h1>Upcoming Events</h1>
            <button onClick={() => navigate("/create-event")}>Create Event</button>

            <div>
                {loading ? (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <p style={{ fontSize: "18px", fontWeight: "bold" }}>Loading...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <p style={{ fontSize: "18px", fontWeight: "bold" }}>No upcoming events.</p>
                        <p>Be the first to create one!</p>
                        <button onClick={() => navigate("/create-event")}>Create an Event</button>
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {events.map(event => (
                            <li key={event.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "8px", display: "flex", alignItems: "center" }}>
                                <img
                                    src={event.thumbnail}
                                    alt="Event Thumbnail"
                                    style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", marginRight: "10px" }}
                                    onError={(e) => {
                                        console.warn(`Failed to load thumbnail for "${event.title}", using default.`);
                                        e.target.onerror = null; // Prevent infinite loop
                                        e.target.src = defaultThumbnail;
                                    }}
                                />

                                <div>
                                    <h2>{event.title}</h2>
                                    <p>{truncateText(event.description, 100)}</p>
                                    <p><strong>Date:</strong> {event.date instanceof Date ? event.date.toLocaleDateString() : "Invalid Date"}</p>
                                    <p><strong>Time:</strong> {event.localTime}</p>
                                    <p><strong>Location:</strong> {event.location}</p>
                                    <button onClick={() => navigate(`/events/${event.id}`)}>View Details</button>
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

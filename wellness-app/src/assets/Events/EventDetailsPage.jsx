import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { db, auth } from "../Firebase";
import { formatToLocalTime } from "./EventsPage";
import dummyPic from "../dummyPic.jpeg"; // Replace with your default profile pic

function EventDetailsPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [creatorName, setCreatorName] = useState("Unknown User");
    const [creatorPic, setCreatorPic] = useState(dummyPic);
    const [creatorId, setCreatorId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(auth.currentUser);

    useEffect(() => {
        async function fetchEventDetails() {
            try {
                const eventDoc = await getDoc(doc(db, "events", eventId));
                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    const eventDate = eventData.date?.toDate ? eventData.date.toDate() : null;

                    let eventDateTime = null;
                    if (eventDate && eventData.time) {
                        eventDateTime = new Date(`${eventDate.toDateString()} ${eventData.time}`);
                    }

                    setEvent({
                        ...eventData,
                        date: eventDate,
                        localTime: eventDateTime ? formatToLocalTime(eventDateTime) : "Time unavailable",
                    });

                    // Fetch creator details
                    if (eventData.createdBy) {
                        const userDoc = await getDoc(doc(db, "users", eventData.createdBy));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setCreatorName(userData.displayName || "Unknown User");
                            setCreatorPic(userData.profilePicUrl || dummyPic);
                            setCreatorId(eventData.createdBy);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEventDetails();
    }, [eventId]);

    async function handleDelete() {
        if (!event) return;

        const confirmDelete = window.confirm("Are you sure you want to delete this event?");
        if (!confirmDelete) return;

        try {
            const storage = getStorage();

            // Delete event images from Firebase Storage
            if (event.images?.length > 0) {
                await Promise.all(
                    event.images.map(async (imageUrl) => {
                        const imageRef = ref(storage, imageUrl);
                        try {
                            await deleteObject(imageRef);
                        } catch (error) {
                            console.error("Error deleting image:", error);
                        }
                    })
                );
            }

            // Delete event from Firestore
            await deleteDoc(doc(db, "events", eventId));

            alert("Event deleted successfully.");
            navigate("/events");
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event.");
        }
    }

    if (loading) return <p>Loading event details...</p>;
    if (!event) return <p>Event not found.</p>;

    return (
        <div>
            {/* Back to Events Button */}
            <button
                onClick={() => navigate("/events")}
                style={{
                    marginBottom: "15px",
                    padding: "8px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                }}
            >
                ← Back to Events
            </button>

            <h1>{event.title}</h1>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Date:</strong> {event.date?.toLocaleDateString() || "Date unavailable"}</p>
            <p><strong>Time:</strong> {event.localTime}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Participants:</strong> {event.attendees.length} {event.maxParticipants === -1 ? "(Unlimited)" : `/${event.maxParticipants}`}</p>

            {/* Creator Section */}
            <div style={{ marginTop: "10px" }}>
                <strong>Created by:</strong>
                {user ? (
                    <a
                        href={`/profile/${event.createdBy}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            textDecoration: "underline",
                            color: "#007bff", /* Bootstrap's blue */
                            fontWeight: "bold",
                            marginLeft: "5px"
                        }}
                    >
                        {creatorName}
                        <img
                            src={creatorPic || dummyPic}
                            alt={`${creatorName}'s profile`}
                            style={{ width: "40px", height: "40px", borderRadius: "50%", marginLeft: "8px" }}
                        />
                    </a>
                ) : (
                    <span style={{ marginLeft: "5px", fontStyle: "italic", color: "#888" }}>
                        Log in to see the creator
                    </span>
                )}
            </div>



            <button>Register for Event</button>

            {/* Show Delete Button only if user is creator */}
            {user?.uid === event.createdBy && (
                <button
                    onClick={handleDelete}
                    style={{
                        marginTop: "20px",
                        padding: "10px",
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Delete Event
                </button>
            )}

            {/* Display event images */}
            <h3>Event Images</h3>
            {event.images?.length > 0 ? (
                <div style={{ display: "flex", overflowX: "auto", gap: "10px", marginTop: "10px" }}>
                    {event.images.map((imageUrl, index) => (
                        <img
                            key={index}
                            src={imageUrl}
                            alt={`Event ${index + 1}`}
                            style={{ width: "200px", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                        />
                    ))}
                </div>
            ) : (
                <p>No images available for this event.</p>
            )}
        </div>
    );
}

export default EventDetailsPage;

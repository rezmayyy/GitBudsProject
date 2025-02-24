import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, deleteDoc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { db, auth } from "../Firebase";
import { formatToLocalTime } from "./EventsPage";
import dummyPic from "../dummyPic.jpeg"; // Replace with your default profile pic
import RegistrationForm from "./RegistrationForm";
import ParticipantList from "./ParticipantList";
import Events from "./Events.css";

function EventDetailsPage() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [creatorName, setCreatorName] = useState("Unknown User");
    const [creatorPic, setCreatorPic] = useState(dummyPic);
    const [creatorId, setCreatorId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(auth.currentUser);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [participants, setParticipants] = useState(0);  // New state for participant count
    const [userRegistered, setUserRegistered] = useState(false); // New state for user registration status

    const handleRegisterClick = () => {
        setShowRegistrationForm(true);
    };

    const handleCloseForm = () => {
        setShowRegistrationForm(false);
    };

    const handleUnregister = async () => {
        if (!auth.currentUser || !event) return;

        try {
            const userIsRegistered = event.attendees.some(attendee => attendee.uid === auth.currentUser.uid);

            if (!userIsRegistered) {
                alert("You are not registered for this event.");
                return;
            }

            const eventRef = doc(db, "events", eventId);

            // Find the index of the user to remove from the attendees array
            const indexToRemove = event.attendees.findIndex(attendee => attendee.uid === auth.currentUser.uid);

            if (indexToRemove === -1) {
                console.log("User not found in attendees array.");
                return;
            }

            // Construct a new array excluding the user
            const updatedAttendees = [
                ...event.attendees.slice(0, indexToRemove),
                ...event.attendees.slice(indexToRemove + 1)
            ];

            // Update the document with the new attendees array
            await updateDoc(eventRef, {
                attendees: updatedAttendees
            });

            // Reload the page to get fresh data
            window.location.reload(); // This will refresh the page and fetch the latest data

            alert("You have been unregistered from the event.");
        } catch (error) {
            console.error("Error unregistering:", error);
            alert("Failed to unregister.");
        }
    };

    useEffect(() => {
        let unsubscribe; // Declare outside to clean up properly

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
                        endTime: eventData.endTime || "",
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

                    // Real-time listener for attendees
                    const eventRef = doc(db, "events", eventId);
                    unsubscribe = onSnapshot(eventRef, (doc) => {
                        if (doc.exists()) {
                            const data = doc.data();
                            setParticipants(data.attendees ? data.attendees.length : 0); // Update count

                            // Check if current user is registered
                            if (auth.currentUser && data.attendees) {
                                const isUserRegistered = data.attendees.some(
                                    (attendee) => attendee.uid === auth.currentUser.uid
                                );
                                setUserRegistered(isUserRegistered);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEventDetails();

        // Cleanup listener when the component is unmounted
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
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
        <div className="event-details-container">
            <button className="back-button" onClick={() => navigate("/events")}>
                ← Back to Events
            </button>
            <div className="event-info-details">
                <h1 className="event-title-details">{event.title}</h1>
                {userRegistered ? (
                <button className="unregister-button" onClick={handleUnregister}>
                    Unregister from Event
                </button>
            ) : (
                <button className="register-button" onClick={handleRegisterClick}>
                    Register for Event
                </button>
            )}

            {showRegistrationForm && (
                <RegistrationForm eventId={eventId} onClose={handleCloseForm} />
            )}

            {user?.uid === event.createdBy && (
                <button className="delete-button" onClick={handleDelete}>
                    Delete Event
                </button>
            )}
                <p><strong>Date:</strong> {event.date?.toLocaleDateString() || "Date unavailable"}</p>
                <p><strong>Time:</strong> {event.localTime} {event.endTime ? ` - ${formatToLocalTime(new Date(`1970-01-01T${event.endTime}`))}` : ""}</p>
                <p><strong>Event Type:</strong> {event.eventType || "Not specified"}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Participants:</strong> {participants} {event.maxParticipants === -1 ? "(Unlimited)" : `/${event.maxParticipants}`}</p>
                <ParticipantList attendees={event.attendees || []} />
                <br></br><br></br>
                <strong>Description:</strong><br></br> 
                <div className="event-info-description">
                    {event.description}
                </div>
            </div>
            <br></br>

            <div className="event-creator">
                <strong>Created by:</strong>
                {user ? (
                    <a href={`/profile/${event.createdBy}`} className="creator-link">
                        {creatorName}
                        <img src={creatorPic || dummyPic} alt={`${creatorName}'s profile`} className="creator-image" />
                    </a>
                ) : (
                    <span className="creator-placeholder">
                        Log in to see the creator
                    </span>
                )}
            </div>
            <br></br><br></br>

            <h3>Event Images</h3>
            {event.images?.length > 0 ? (
                <div className="event-images-container">
                    {event.images.map((imageUrl, index) => (
                        <img key={index} src={imageUrl} alt={`Event ${index + 1}`} className="event-image" />
                    ))}
                </div>
            ) : (
                <p>No images available for this event.</p>
            )}
        </div>
    );

}

export default EventDetailsPage;

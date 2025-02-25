import { useState } from "react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db, auth } from "../Firebase";
import styles from '../../styles/Events.css';

function RegistrationForm({ eventId, onClose }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const [isRegistered, setIsRegistered] = useState(false); // State for success message

    const handleSubmit = async (e) => {
        e.preventDefault();
      
        // Validation
        if (!firstName || !lastName) {
            setError("Both fields are required.");
            return;
        }
      
        const user = auth.currentUser;
        if (!user) {
            setError("You must be logged in to register.");
            return;
        }
      
        try {
            const eventRef = doc(db, "events", eventId);
            const eventDoc = await getDoc(eventRef);
      
            if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                const attendees = eventData.attendees || [];
                const maxParticipants = eventData.maxParticipants;
      
                // Check if user is already registered
                const alreadyRegistered = attendees.some((attendee) => attendee.uid === user.uid);
                if (alreadyRegistered) {
                    setError("You are already registered for this event.");
                    return;
                }
      
                // Check if registration limit has been reached
                if (maxParticipants !== -1 && attendees.length >= maxParticipants) {
                    setError("Event has reached its participant limit.");
                    return;
                }
      
                // Only update the 'attendees' array
                await updateDoc(eventRef, {
                    attendees: arrayUnion({
                        uid: user.uid,
                        displayName: user.displayName,
                        firstName,
                        lastName,
                    }),
                });
      
                // Set registered state to true
                setIsRegistered(true); // Show confirmation message
            }
        } catch (error) {
            setError("An error occurred while registering.");
            console.error("Registration error:", error);
        }
    };
    
    const handleConfirmationClose = () => {
        onClose(); // Close modal
        window.location.reload(); // Refresh the page
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Register for Event</h2>
                {isRegistered ? (
                    <div className="confirmation-message">
                        <p>You have successfully registered for the event!</p>
                        <button onClick={handleConfirmationClose}>Close</button> {/* Close the confirmation message */}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                maxLength={20}
                            />
                        </div>
                        <div>
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                maxLength={20}
                            />
                        </div>
                        {error && <p className="error">{error}</p>}
                        <button type="submit">Submit</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default RegistrationForm;

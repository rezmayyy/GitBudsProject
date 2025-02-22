import { useState } from "react";
import PropTypes from "prop-types";

function ParticipantList({ attendees }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ marginTop: "10px" }}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ padding: "5px 10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
                {isOpen ? "Hide Participants" : "View Participants"}
            </button>
            {isOpen && (
                <ul style={{ listStyleType: "none", padding: 0, marginTop: "10px", border: "1px solid #ddd", borderRadius: "5px", padding: "10px", maxWidth: "300px", backgroundColor: "#f9f9f9" }}>
                    <h3 style={{ margin: "0 0 10px 0" }}>Attendees</h3>
                    {attendees.length > 0 ? (
                        attendees.map((attendee) => (
                            <li key={attendee.uid} style={{ padding: "5px 0" }}>
                                <a 
                                    href={`/profile/${attendee.uid}`} 
                                    style={{ textDecoration: "none", color: "#007bff", fontWeight: "bold" }}
                                >
                                    {attendee.firstName} {attendee.lastName} ({attendee.displayName})
                                </a>
                            </li>
                        ))
                    ) : (
                        <li style={{ fontStyle: "italic", color: "#888" }}>No participants yet.</li>
                    )}
                </ul>
            )}
        </div>
    );
}

ParticipantList.propTypes = {
    attendees: PropTypes.arrayOf(
        PropTypes.shape({
            displayName: PropTypes.string.isRequired,
            firstName: PropTypes.string.isRequired,
            lastName: PropTypes.string.isRequired,
            uid: PropTypes.string.isRequired,
        })
    ).isRequired,
};

export default ParticipantList;

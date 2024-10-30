import React, { useEffect, useState, useContext } from 'react';
import { db } from './Firebase'; // Ensure this imports the Firestore instance correctly
import UserContext from './UserContext'; // Import the UserContext
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'; // Import necessary Firestore functions
import styles from '../styles/TicketList.module.css'; // Import the CSS module

function TicketList() {
    const [tickets, setTickets] = useState([]);
    const { user } = useContext(UserContext); // Access the user context
    const [view, setView] = useState('assigned'); // State to track which tickets to show
    const [currentPage, setCurrentPage] = useState(1); // Current page state
    const [ticketsPerPage] = useState(5); // Tickets per page state

    // Function to format date to MM/DD/YYYY HH:MM AM/PM
    const formatTime = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const formattedDate = date.toLocaleDateString(undefined, options); // Formats date to MM/DD/YYYY

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert to 12-hour format
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add leading zero if needed

        return `${formattedDate} ${formattedHours}:${formattedMinutes} ${ampm}`; // Return formatted date and time
    };

    // Fetch tickets function    
    const fetchTickets = async () => {
        try {
            const ticketCollectionRef = collection(db, 'tickets');
            const snapshot = await getDocs(ticketCollectionRef);
            const ticketData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(), // Convert Firestore Timestamp to Date
            }));
    
            setTickets(ticketData); // Set all tickets for filtering later
        } catch (error) {
            console.error("Error fetching tickets: ", error);
        }
    };

    useEffect(() => {
        fetchTickets(); // Fetch tickets on component mount
    }, [user]);

    const handleClaim = async (ticketId) => {
        // Claim the ticket logic
        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, {
            staffId: user.uid, // Set the staff ID
            staffName: user.displayName, // Set the staff name
            status: 'open', // Update status to open
        });
        fetchTickets(); // Refresh ticket list after claiming
    };

    const handleClose = async (ticketId) => {
        // Close the ticket logic
        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, {
            status: 'closed', // Update status to closed
        });
        fetchTickets(); // Refresh ticket list after closing
    };

    const handleRefresh = () => {
        fetchTickets(); // Refresh ticket list on button click
    };

    const handleViewChange = (newView) => {
        setView(newView); // Update the view state
    };

    if (!user) {
        return <p>Please log in to view your tickets.</p>; // Optional: Show a message for unauthorized users
    }

    // Filter tickets based on view
    const assignedTickets = tickets.filter(ticket => ticket.staffId === user.uid && ticket.status !== 'closed'); // Exclude closed tickets
    const closedTickets = tickets.filter(ticket => ticket.status === 'closed');
    const unassignedTickets = tickets.filter(ticket => !ticket.staffId && ticket.status === 'pending'); // Unassigned pending tickets

    // Pagination Logic
    const totalPages = Math.ceil(assignedTickets.length / ticketsPerPage); // Total pages based on assigned tickets
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentAssignedTickets = assignedTickets.slice(indexOfFirstTicket, indexOfLastTicket); // Current tickets for display

    return (
        <div className={styles.ticketListContainer}>
            <h2>{user.role === 'admin' || user.role === 'moderator' ? "All Tickets" : "Your Tickets"}</h2>

            {user.role === 'admin' || user.role === 'moderator' ? (
                <>
                    {/* Button group for ticket views */}
                    <div className={styles.buttonGroup}>
                        <button className={styles.viewButton} onClick={() => handleViewChange('assigned')}>Assigned Tickets</button>
                        <button className={styles.viewButton} onClick={() => handleViewChange('unassigned')}>Unassigned Tickets</button>
                        <button className={styles.viewButton} onClick={() => handleViewChange('closed')}>Closed Tickets</button>
                    </div>

                    <button className={styles.refreshButton} onClick={handleRefresh}>
                        Refresh Tickets
                    </button>

                    {/* Conditional rendering based on selected view */}
                    {view === 'assigned' && (
                        <div className={styles.category}>
                            <h3>Assigned Tickets</h3>
                            {currentAssignedTickets.length === 0 ? (
                                <p>No assigned tickets available.</p>
                            ) : (
                                currentAssignedTickets.map(ticket => (
                                    <div className={styles.ticketItem} key={ticket.id}>
                                        <h3>{ticket.title}</h3>
                                        <p>{ticket.description}</p>
                                        <p>Submitted by: {ticket.displayName}</p>
                                        <p>Status: {ticket.status}</p>
                                        <p>Created At: {formatTime(ticket.createdAt)}</p> {/* Display creation date */}
                                        <button className={styles.button} onClick={() => handleClose(ticket.id)}>Close</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {view === 'unassigned' && (
                        <div className={styles.category}>
                            <h3>Unassigned Tickets</h3>
                            {unassignedTickets.length === 0 ? (
                                <p>No unassigned tickets available.</p>
                            ) : (
                                unassignedTickets.map(ticket => (
                                    <div className={styles.ticketItem} key={ticket.id}>
                                        <h3>{ticket.title}</h3>
                                        <p>{ticket.description}</p>
                                        <p>Created At: {formatTime(ticket.createdAt)}</p> {/* Display creation date */}
                                        <button className={styles.button} onClick={() => handleClaim(ticket.id)}>Claim</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {view === 'closed' && (
                        <div className={styles.category}>
                            <h3>Closed Tickets</h3>
                            {closedTickets.length > 0 ? (
                                closedTickets.map(ticket => (
                                    <div className={styles.ticketItem} key={ticket.id}>
                                        <h3>{ticket.title}</h3>
                                        <p>{ticket.description}</p>
                                        <p>Assigned to: {ticket.staffName}</p>
                                        <p>Created At: {formatTime(ticket.createdAt)}</p> {/* Display creation date */}
                                    </div>
                                ))
                            ) : (
                                <p>No closed tickets available.</p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.category}>
                    <h3>Your Tickets</h3>
                    {currentAssignedTickets.length === 0 ? (
                        <p>No tickets available.</p>
                    ) : (
                        currentAssignedTickets.map(ticket => (
                            <div className={styles.ticketItem} key={ticket.id}>
                                <h3>{ticket.title}</h3>
                                <p>{ticket.description}</p>
                                <p>Status: {ticket.status}</p>
                                <p>Created At: {formatTime(ticket.createdAt)}</p> {/* Display creation date */}
                                <button className={styles.button} onClick={() => handleClose(ticket.id)}>Close</button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            <div className={styles.pagination}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
}

export default TicketList;

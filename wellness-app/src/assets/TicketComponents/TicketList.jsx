import React, { useEffect, useState, useContext } from 'react';
import { db } from '../Firebase';
import UserContext from '../UserContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import styles from '../../styles/TicketList.module.css';
import TicketFilters from './TicketFilters';
import TicketItem from './TicketItem';
import ViewTicket from './ViewTicket';

function TicketList() {
    const [tickets, setTickets] = useState([]);
    const { user } = useContext(UserContext);
    const [view, setView] = useState('assigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [ticketsPerPage] = useState(5);
    const [viewedTicketId, setViewedTicketId] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'tickets'));
            const ticketData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
                staffName: doc.data().staffName,
                displayName: doc.data().displayName,
            }));
            setTickets(ticketData);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        }
    };

    const onView = (ticketId) => {
        setViewedTicketId(ticketId);
    };

    const handleClose = async (ticketId) => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, { status: 'closed' });
            fetchTickets();
        } catch (error) {
            console.error("Error closing ticket:", error);
        }
    };

    const handleClaim = async (ticketId) => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, { staffId: user.uid, status: 'assigned' });
            fetchTickets();
        } catch (error) {
            console.error("Error claiming ticket:", error);
        }
    };

    const changeView = (newView) => {
        setView(newView);
        setCurrentPage(1); // Reset to the first page when changing view
    };

    const filteredTickets = tickets
    .filter(ticket => {
        if (user.role === 'admin' || user.role === 'moderator') {
            if (view === 'assigned') return ticket.staffId === user.uid && ticket.status !== 'closed';
            if (view === 'unassigned') return !ticket.staffId && ticket.status === 'pending';
            return ticket.status === 'closed';
        }
        return ticket.userId === user.uid;
    })
    .sort((a, b) => {
        // Category priority: Premium > VIP > normal
        const categoryPriority = { 'Premium': 1, 'VIP': 2, 'normal': 3 };
        const categoryOrder = categoryPriority[a.category || 'normal'] - categoryPriority[b.category || 'normal'];
        
        // If categories are the same, sort by status and then createdAt (newest first)
        if (categoryOrder === 0) {
            const statusPriority = { 'assigned': 1, 'pending': 2, 'closed': 3 };
            const statusOrder = statusPriority[a.status] - statusPriority[b.status];
            if (statusOrder === 0) {
                return b.createdAt - a.createdAt;
            }
            return statusOrder;
        }
        
        return categoryOrder;
    });


    // Calculate the tickets to display based on pagination
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

    return (
        <div className={styles.ticketListContainer}>
            {viewedTicketId ? (
                <ViewTicket ticketId={viewedTicketId} onBack={() => setViewedTicketId(null)} />
            ) : (
                <>
                    <h2>{user.role === 'admin' || user.role === 'moderator' ? "All Tickets" : "Your Tickets"}</h2>
                    {user.role === 'admin' || user.role === 'moderator' ? (
                        <>
                            <TicketFilters currentView={view} setView={changeView} />
                            <button className={styles.refreshButton} onClick={fetchTickets}>Refresh Tickets</button>
                            <div className={styles.category}>
                                {currentTickets.length === 0 ? (
                                    <p>No {view} tickets available.</p>
                                ) : (
                                    currentTickets.map(ticket => (
                                        <TicketItem 
                                            key={ticket.id} 
                                            ticket={ticket} 
                                            onClaim={handleClaim} 
                                            onClose={handleClose} 
                                            onView={onView} 
                                            view={view}
                                            status={ticket.status} 
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className={styles.category}>
                            <h3>Your Tickets</h3>
                            {currentTickets.length === 0 ? (
                                <p>No tickets available.</p>
                            ) : (
                                currentTickets.map(ticket => (
                                    <TicketItem 
                                        key={ticket.id} 
                                        ticket={ticket} 
                                        onClose={handleClose} 
                                        view="assigned" 
                                        onView={onView}
                                        status={ticket.status} 
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
            <div className={styles.pagination}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    Previous
                </button>
                <span>Page {currentPage} of {Math.ceil(filteredTickets.length / ticketsPerPage)}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredTickets.length / ticketsPerPage)))} disabled={currentPage === Math.ceil(filteredTickets.length / ticketsPerPage)}>
                    Next
                </button>
            </div>
        </div>
    );    
}

export default TicketList;

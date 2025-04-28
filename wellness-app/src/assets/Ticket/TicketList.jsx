import React, { useEffect, useState, useContext } from 'react';
import { db } from '../Firebase';
import UserContext from '../UserContext';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import styles from './TicketList.module.css';
import TicketFilters from './TicketFilters';
import TicketItem from './TicketItem';
import ViewTicket from './ViewTicket';
import { useNavigate } from 'react-router-dom';

function TicketList({ onCreateTicket }) {
    const [tickets, setTickets] = useState([]);
    const { user } = useContext(UserContext);
    const [view, setView] = useState('assigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [ticketsPerPage] = useState(5);
    const [viewedTicketId, setViewedTicketId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        try {
            let q;
            if (user.role === 'admin' || user.role === 'moderator') {
                q = collection(db, 'tickets');
            } else {
                q = query(collection(db, 'tickets'), where('userId', '==', user.uid));
            }
            const snapshot = await getDocs(q);
            const ticketData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
            }));
            setTickets(ticketData);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    const onView = ticketId => setViewedTicketId(ticketId);

    const handleClose = async ticketId => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, { status: 'closed' });
            fetchTickets();
        } catch (error) {
            console.error('Error closing ticket:', error);
        }
    };

    const handleClaim = async ticketId => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, { staffId: user.uid, status: 'assigned' });
            fetchTickets();
        } catch (error) {
            console.error('Error claiming ticket:', error);
        }
    };

    const changeView = newView => {
        setView(newView);
        setCurrentPage(1);
    };

    // Filter and sort tickets
    const filteredTickets = tickets
        .filter(ticket => {
            if (user.role === 'admin' || user.role === 'moderator') {
                if (view === 'assigned') return ticket.staffId === user.uid && ticket.status !== 'closed';
                if (view === 'unassigned') return !ticket.staffId && ticket.status === 'pending' && ticket.category !== 'report';
                if (view === 'reports') return ticket.category === 'report';
                return ticket.status === 'closed';
            }
            return ticket.userId === user.uid;
        })
        .sort((a, b) => {
            if (view === 'assigned') {
                if (a.category === 'report' && b.category !== 'report') return -1;
                if (a.category !== 'report' && b.category === 'report') return 1;
            }
            const categoryPriority = { report: 0, Premium: 1, VIP: 2, normal: 3 };
            const catOrder = categoryPriority[a.category || 'normal'] - categoryPriority[b.category || 'normal'];
            if (catOrder === 0) {
                const statusPriority = { assigned: 1, pending: 2, closed: 3 };
                const statOrder = statusPriority[a.status] - statusPriority[b.status];
                return statOrder === 0 ? b.createdAt - a.createdAt : statOrder;
            }
            return catOrder;
        });

    const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));
    const indexOfLast = currentPage * ticketsPerPage;
    const indexOfFirst = indexOfLast - ticketsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirst, indexOfLast);

    return (
        <div className={styles.ticketListContainer}>
            {viewedTicketId ? (
                <ViewTicket ticketId={viewedTicketId} onBack={() => setViewedTicketId(null)} />
            ) : (
                <>
                    <h2>{user.role === 'admin' || user.role === 'moderator' ? 'All Tickets' : 'Your Tickets'}</h2>
                    <button className={styles.newTicketButton} onClick={onCreateTicket}>
                        + New Ticket
                    </button>
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
                            {currentTickets.length === 0 ? (
                                <p>No tickets available.</p>
                            ) : (
                                currentTickets.map(ticket => (
                                    <TicketItem
                                        key={ticket.id}
                                        ticket={ticket}
                                        onClose={handleClose}
                                        onView={onView}
                                        view="assigned"
                                        status={ticket.status}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            {!viewedTicketId && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default TicketList;

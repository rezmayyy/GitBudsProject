import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from './TicketList.module.css';

function TicketItem({ ticket, onView, onClaim, onClose, view, status }) {
    // Instead of using ticket.displayName, fetch the user's displayName using ticket.userId.
    const [displayName, setDisplayName] = useState("Loading...");

    useEffect(() => {
        async function fetchUserName() {
            try {
                const userDoc = await getDoc(doc(db, 'users', ticket.userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setDisplayName(data.displayName || "Unknown");
                } else {
                    setDisplayName("Unknown");
                }
            } catch (err) {
                console.error("Error fetching user for ticket", err);
                setDisplayName("Unknown");
            }
        }
        if (ticket.userId) {
            fetchUserName();
        }
    }, [ticket.userId]);

    // Determine CSS class based on ticket category.
    const ticketClass = ticket.category === 'Premium'
        ? styles.premiumTicket
        : ticket.category === 'VIP'
            ? styles.vipTicket
            : ticket.category === 'report'
                ? styles.reportTicket
                : styles.normalTicket;

    return (
        <div className={`${styles.ticketItem} ${ticketClass}`} onClick={() => onView(ticket.id)}>
            <h4>{ticket.title}</h4>
            <p>Submitted by: {displayName}</p>
            {ticket.category && <span className={styles.categoryTag}>{ticket.category} Ticket</span>}
            <div>
                {view === 'unassigned' && (
                    <button onClick={(e) => { e.stopPropagation(); onClaim(ticket.id); }}>
                        Claim
                    </button>
                )}
                {view === 'assigned' && status !== 'closed' && (
                    <button onClick={(e) => { e.stopPropagation(); onClose(ticket.id); }}>
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

export default TicketItem;

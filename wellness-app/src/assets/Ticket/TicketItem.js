// TicketItem.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from './TicketList.module.css';

function TicketItem({ ticket, onView, onClaim, onClose, view, status }) {
    // local state for display name
    const [displayName, setDisplayName] = useState('Loading...');

    useEffect(() => {
        let isMounted = true;

        async function fetchUserName() {
            if (!ticket.userId) {
                if (isMounted) setDisplayName('Unknown');
                return;
            }
            try {
                const userSnap = await getDoc(doc(db, 'users', ticket.userId));
                if (!isMounted) return;
                if (userSnap.exists()) {
                    setDisplayName(userSnap.data().displayName || 'Unknown');
                } else {
                    setDisplayName('Unknown');
                }
            } catch (err) {
                console.error('Error fetching user for ticket', err);
                if (isMounted) setDisplayName('Unknown');
            }
        }

        fetchUserName();

        return () => {
            isMounted = false;
        };
    }, [ticket.userId]);

    // Decide styling based on category
    const ticketClass =
        ticket.category === 'Premium' ? styles.premiumTicket :
            ticket.category === 'VIP' ? styles.vipTicket :
                ticket.category === 'report' ? styles.reportTicket :
                    styles.normalTicket;

    return (
        <div
            className={`${styles.ticketItem} ${ticketClass}`}
            onClick={() => onView(ticket.id)}
        >
            <h4>{ticket.title}</h4>
            <p>Submitted by: {displayName}</p>
            {ticket.category && (
                <span className={styles.categoryTag}>
                    {ticket.category} Ticket
                </span>
            )}
            <div>
                {view === 'unassigned' && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onClaim(ticket.id);
                        }}
                    >
                        Claim
                    </button>
                )}
                {view === 'assigned' && status !== 'closed' && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            onClose(ticket.id);
                        }}
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}

export default TicketItem;

import React from 'react';
import styles from './TicketList.module.css';

function TicketItem({ ticket, onView, onClaim, onClose, view, status }) {
    // Determine the class based on the ticket's category.
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
            <p>Submitted by: {ticket.displayName}</p>
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

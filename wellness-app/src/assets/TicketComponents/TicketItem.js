import React from 'react';
import styles from '../../styles/TicketList.module.css';

function TicketItem({ ticket, onClaim, onClose, onView, view, status }) {
    return (
        <div className={styles.ticketItem}>
            <h3>Title: {ticket.title}</h3>
            <p className={`${styles.ticketStatus} ${styles[status]}`}>Status: {status}</p>
            <p>Created At: {ticket.createdAt.toLocaleString()}</p>
            <button className={styles.button} onClick={() => onView(ticket.id)}>View Ticket</button>
            {view === 'assigned' && (
                <button className={styles.button} onClick={() => onClose(ticket.id)}>Close</button>
            )}
            {view === 'unassigned' && (
                <button className={styles.button} onClick={() => onClaim(ticket.id)}>Claim</button>
            )}
        </div>
    );
}

export default TicketItem;

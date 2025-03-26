import React, { useState } from 'react';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import styles from './Ticket.module.css';

function Ticket() {
    const [creating, setCreating] = useState(false);

    const handleCreateClick = () => setCreating(true);
    const handleCancel = () => setCreating(false);
    const handleTicketSubmitted = () => {
        setCreating(false);
    };

    return (
        <div className={styles.ticketContainer}>
            {creating ? (
                <div className={styles.createTicket}>
                    <CreateTicket onCancel={handleCancel} onSubmitted={handleTicketSubmitted} />
                </div>
            ) : (
                <div className={styles.ticketList}>
                    <TicketList onCreateTicket={handleCreateClick} />
                </div>
            )}
        </div>
    );
}

export default Ticket;
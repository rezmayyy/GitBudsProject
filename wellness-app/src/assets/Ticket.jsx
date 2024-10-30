import React from 'react';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
//import '../styles/ticket.css'; // Optional: import any relevant styles

function Ticket() {
    return (
        <div className="ticket-container">
            <h1>Support Tickets</h1>
            <div className="create-ticket">
                <h2>Create a New Ticket</h2>
                <CreateTicket />
            </div>
            <div className="ticket-list">
                <TicketList />
            </div>
        </div>
    );
}

export default Ticket;
import React from 'react';
import styles from '../../styles/TicketList.module.css';

function TicketFilters({ currentView, setView }) {
    return (
        <div className={styles.buttonGroup}>
            <button 
                className={styles.viewButton} 
                onClick={() => setView('assigned')}
                disabled={currentView === 'assigned'}
            >
                Assigned Tickets
            </button>
            <button 
                className={styles.viewButton} 
                onClick={() => setView('unassigned')}
                disabled={currentView === 'unassigned'}
            >
                Unassigned Tickets
            </button>
            <button 
                className={styles.viewButton} 
                onClick={() => setView('closed')}
                disabled={currentView === 'closed'}
            >
                Closed Tickets
            </button>
        </div>
    );
}

export default TicketFilters;

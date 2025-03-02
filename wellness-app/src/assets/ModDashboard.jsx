import React, { useState } from 'react';
import ManageUsers from './ManageUsers';
import ManagePosts from './ManagePosts';
import TicketList from './Ticket/TicketList';
import ManageHealerApplications from './ManageHealerApplications';
import styles from '../styles/ModDashboard.module.css';

const ModDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('manageUsers');

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar for navigation */}
      <div className={styles.sidebar}>
        <button
          className={`${styles.sidebarButton} ${selectedTab === 'manageUsers' ? styles.active : ''}`}
          onClick={() => setSelectedTab('manageUsers')}
        >
          Manage Users
        </button>
        <button
          className={`${styles.sidebarButton} ${selectedTab === 'managePosts' ? styles.active : ''}`}
          onClick={() => setSelectedTab('managePosts')}
        >
          Manage Posts
        </button>
        <button
          className={`${styles.sidebarButton} ${selectedTab === 'manageTickets' ? styles.active : ''}`}
          onClick={() => setSelectedTab('manageTickets')}
        >
          Manage Tickets
        </button>
        <button
          className={`${styles.sidebarButton} ${selectedTab === 'manageHealers' ? styles.active : ''}`}
          onClick={() => setSelectedTab('manageHealers')}
        >
          Manage Healer Applications
        </button>
        
      </div>

      {/* Main content area */}
      <div className={styles.contentWrapper}>
        {selectedTab === 'manageUsers' && <ManageUsers />}
        {selectedTab === 'managePosts' && <ManagePosts />}
        {selectedTab === 'manageTickets' && <TicketList />}
        {selectedTab === 'manageHealers' && <ManageHealerApplications />}
      </div>
    </div>
  );
};

export default ModDashboard;

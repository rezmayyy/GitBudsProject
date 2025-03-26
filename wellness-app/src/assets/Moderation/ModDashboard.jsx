import React, { useState, useContext } from 'react';
import ManageUsers from './ManageUsers';
import ManagePosts from './ManagePosts';
import TicketList from '../Ticket/TicketList';
import ManageFAQ from './ManageFAQ';
import ManageTOS from './ManageTOS';
import ManageHealerApplications from './ManageHealerApplications';
import UserContext from '../UserContext';
import ManageTags from './ManageTags';
import ManageMods from './ManageMods';
import styles from '../../styles/ModDashboard.module.css';

const ModDashboard = () => {
  const { user } = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState('manageUsers');

  // Helper: check if current user is admin
  const isAdmin = user && user.role === 'admin';

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
          className={`${styles.sidebarButton} ${selectedTab === 'manageTags' ? styles.active : ''}`}
          onClick={() => setSelectedTab('manageTags')}
        >
          Manage Tags
        </button>

        {/* Only show these tabs if the current user is an admin */}
        {isAdmin && (
          <div>
            <button
              className={`${styles.sidebarButton} ${selectedTab === 'manageHealers' ? styles.active : ''}`}
              onClick={() => setSelectedTab('manageHealers')}
            >
              Manage Healer Applications
            </button>
            <button
              className={`${styles.sidebarButton} ${selectedTab === 'manageFAQ' ? styles.active : ''}`}
              onClick={() => setSelectedTab('manageFAQ')}
            >
              Edit FAQ
            </button>
            <button
              className={`${styles.sidebarButton} ${selectedTab === 'manageTOS' ? styles.active : ''}`}
              onClick={() => setSelectedTab('manageTOS')}
            >
              Edit TOS
            </button>
            <button
              className={`${styles.sidebarButton} ${selectedTab === 'manageMods' ? styles.active : ''}`}
              onClick={() => setSelectedTab('manageMods')}
            >
              Manage Admins & Mods
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className={styles.contentWrapper}>
        {selectedTab === 'manageUsers' && <ManageUsers />}
        {selectedTab === 'managePosts' && <ManagePosts />}
        {selectedTab === 'manageTickets' && <TicketList />}
        {selectedTab === 'manageTags' && <ManageTags />}
        {selectedTab === 'manageHealers' && isAdmin && <ManageHealerApplications />}
        {selectedTab === 'manageFAQ' && isAdmin && <ManageFAQ />}
        {selectedTab === 'manageTOS' && isAdmin && <ManageTOS />}
        {selectedTab === 'manageMods' && isAdmin && <ManageMods />}
      </div>
    </div>
  );
};

export default ModDashboard;

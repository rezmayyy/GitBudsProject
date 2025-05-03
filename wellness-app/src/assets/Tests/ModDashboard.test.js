import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModDashboard from '../../assets/Moderation/ModDashboard';
import UserContext from '../../assets/UserContext';

// Helper function to render the ModDashboard component with user context
const renderWithUserContext = (user) => {
    return render(
        <MemoryRouter>
            <UserContext.Provider value={{ user }}>
                <ModDashboard />
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('ModDashboard Component', () => {
    test('renders the dashboard with all sidebar buttons', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Check if sidebar buttons are rendered - using role and exact text
        expect(screen.getByRole('button', { name: /manage users/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /manage posts/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /manage tickets/i })).toBeInTheDocument();
    });

    test('can switch between different tabs', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Click on Manage Posts tab
        fireEvent.click(screen.getByRole('button', { name: /manage posts/i }));

        // Click on Manage Tickets tab
        fireEvent.click(screen.getByRole('button', { name: /manage tickets/i }));

    });

    test('renders additional admin-only tabs for admin users', () => {
        const adminUser = {
            uid: 'admin1',
            displayName: 'Admin',
            role: 'admin'
        };

        renderWithUserContext(adminUser);

        // Check if admin-only sidebar buttons are rendered
        expect(screen.getByRole('button', { name: /manage tags/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /manage healer applications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit faq/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit resources faq/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit tos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /manage ceo videos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /manage admins & mods/i })).toBeInTheDocument();
    });

    test('does not render admin-only tabs for moderator users', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Check that admin-only buttons are not rendered
        expect(screen.queryByRole('button', { name: /manage tags/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /manage healer applications/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit faq/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit resources faq/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /edit tos/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /manage ceo videos/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /manage admins & mods/i })).not.toBeInTheDocument();
    });

    test('renders correctly when user is not logged in or has no role', () => {
        // User without role
        const userWithoutRole = {
            uid: 'user1',
            displayName: 'Regular User'
        };

        renderWithUserContext(userWithoutRole);

        // Basic tabs should be visible even without role
        expect(screen.getByRole('button', { name: /manage users/i })).toBeInTheDocument();

        // No admin tabs
        expect(screen.queryByRole('button', { name: /manage healer applications/i })).not.toBeInTheDocument();
    });
});
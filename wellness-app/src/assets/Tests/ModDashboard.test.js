import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ModDashboard from '../../assets/Moderation/ModDashboard';
import UserContext from '../../assets/UserContext';
import ProtectedRoute from '../../assets/ProtectedRoute';

// Mock all the management components
jest.mock('../../assets/Moderation/ManageUsers', () => () => <div data-testid="manage-users">Manage Users Component</div>);
jest.mock('../../assets/Moderation/ManagePosts', () => () => <div data-testid="manage-posts">Manage Posts Component</div>);
jest.mock('../../assets/Ticket/TicketList', () => () => <div data-testid="ticket-list">Ticket List Component</div>);
jest.mock('../../assets/Moderation/ManageTags', () => () => <div data-testid="manage-tags">Manage Tags Component</div>);
jest.mock('../../assets/Moderation/ManageHealerApplications', () => () => <div data-testid="manage-healers">Manage Healer Applications Component</div>);
jest.mock('../../assets/Moderation/ManageFAQ', () => () => <div data-testid="manage-faq">Manage FAQ Component</div>);
jest.mock('../../assets/Moderation/ManageTOS', () => () => <div data-testid="manage-tos">Manage TOS Component</div>);

// Mock react-router-dom navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Helper function to render the component with user context
const renderWithContext = (ui, { user = null } = {}) => {
    return render(
        <MemoryRouter>
            <UserContext.Provider value={{ user }}>
                {ui}
            </UserContext.Provider>
        </MemoryRouter>
    );
};

// Helper function to render the protected route
const renderProtectedRoute = (user = null) => {
    return render(
        <MemoryRouter initialEntries={['/modview']}>
            <UserContext.Provider value={{ user }}>
                <Routes>
                    <Route path="/modview" element={<ProtectedRoute element={ModDashboard} />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('ModDashboard Component', () => {
    // Mock users for testing
    const mockModeratorUser = {
        uid: 'mod123',
        displayName: 'Test Moderator',
        role: 'moderator'
    };

    const mockAdminUser = {
        uid: 'admin123',
        displayName: 'Test Admin',
        role: 'admin'
    };

    const mockRegularUser = {
        uid: 'user123',
        displayName: 'Regular User',
        role: 'user'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Basic rendering of the dashboard for moderator
    test('moderator can view the dashboard with basic tabs', () => {
        renderWithContext(<ModDashboard />, { user: mockModeratorUser });

        // Check if navigation buttons are displayed
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        expect(screen.getByText('Manage Posts')).toBeInTheDocument();
        expect(screen.getByText('Manage Tickets')).toBeInTheDocument();
        expect(screen.getByText('Manage Tags')).toBeInTheDocument();

        // Admin-only buttons should not be visible to moderators
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit FAQ')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit TOS')).not.toBeInTheDocument();

        // Default tab should be "Manage Users"
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();
    });

    // Test 2: Admin can see all tabs including admin-only tabs
    test('admin can view all dashboard tabs including admin-only ones', () => {
        renderWithContext(<ModDashboard />, { user: mockAdminUser });

        // Check if all navigation buttons are displayed, including admin-only ones
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        expect(screen.getByText('Manage Posts')).toBeInTheDocument();
        expect(screen.getByText('Manage Tickets')).toBeInTheDocument();
        expect(screen.getByText('Manage Tags')).toBeInTheDocument();
        expect(screen.getByText('Manage Healer Applications')).toBeInTheDocument();
        expect(screen.getByText('Edit FAQ')).toBeInTheDocument();
        expect(screen.getByText('Edit TOS')).toBeInTheDocument();

        // Default tab should be "Manage Users"
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();
    });

    // Test 3: Tab switching works correctly
    test('clicking on different tabs changes the displayed component', () => {
        renderWithContext(<ModDashboard />, { user: mockModeratorUser });

        // Initially, Manage Users should be active
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();

        // Click on Manage Posts tab
        fireEvent.click(screen.getByText('Manage Posts'));
        expect(screen.getByTestId('manage-posts')).toBeInTheDocument();
        expect(screen.queryByTestId('manage-users')).not.toBeInTheDocument();

        // Click on Manage Tickets tab
        fireEvent.click(screen.getByText('Manage Tickets'));
        expect(screen.getByTestId('ticket-list')).toBeInTheDocument();
        expect(screen.queryByTestId('manage-posts')).not.toBeInTheDocument();

        // Click on Manage Tags tab
        fireEvent.click(screen.getByText('Manage Tags'));
        expect(screen.getByTestId('manage-tags')).toBeInTheDocument();
        expect(screen.queryByTestId('ticket-list')).not.toBeInTheDocument();
    });

    // Test 4: Admin-only tab switching works correctly
    test('admin can access admin-only tabs', () => {
        renderWithContext(<ModDashboard />, { user: mockAdminUser });

        // Initially, Manage Users should be active
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();

        // Click on Manage Healer Applications tab (admin-only)
        fireEvent.click(screen.getByText('Manage Healer Applications'));
        expect(screen.getByTestId('manage-healers')).toBeInTheDocument();

        // Click on Edit FAQ tab (admin-only)
        fireEvent.click(screen.getByText('Edit FAQ'));
        expect(screen.getByTestId('manage-faq')).toBeInTheDocument();
        expect(screen.queryByTestId('manage-healers')).not.toBeInTheDocument();

        // Click on Edit TOS tab (admin-only)
        fireEvent.click(screen.getByText('Edit TOS'));
        expect(screen.getByTestId('manage-tos')).toBeInTheDocument();
        expect(screen.queryByTestId('manage-faq')).not.toBeInTheDocument();
    });
});
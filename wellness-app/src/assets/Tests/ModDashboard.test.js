import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModDashboard from '../../assets/Moderation/ModDashboard';
import UserContext from '../../assets/UserContext';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({
        docs: []
    })),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    deleteDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn((_, callback) => {
        // Simulate empty collections
        callback({
            docs: []
        });
        return jest.fn(); // Return mock unsubscribe function
    }),
    orderBy: jest.fn(),
    limit: jest.fn(),
    serverTimestamp: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({})),
    connectFunctionsEmulator: jest.fn(),
    httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { success: true } }))),
}));

jest.mock('../../assets/Firebase', () => ({
    db: {},
    functions: {},
    storage: {},
}));

// Mock all the child components
// Mock implementation of a test state provider
const TestDataProvider = ({ children }) => {
    return children;
};

// More complex mocks for child components that might access Firebase
jest.mock('../../assets/Moderation/ManageUsers', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-users">Manage Users Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManagePosts', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-posts">Manage Posts Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Ticket/Ticket', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-tickets">Manage Tickets Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageTags', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-tags">Manage Tags Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageHealerApplications', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-healers">Manage Healer Applications Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageFAQ', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-faq">Manage FAQ Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageResourceFAQ', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-resource-faq">Manage Resource FAQ Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageTOS', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-tos">Manage TOS Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageCEOVideo', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-ceo-video">Manage CEO Video Content</div>
        </TestDataProvider>
    );
});

jest.mock('../../assets/Moderation/ManageMods', () => () => {
    return (
        <TestDataProvider>
            <div data-testid="manage-mods">Manage Mods Content</div>
        </TestDataProvider>
    );
});

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

// Use Jest's afterEach instead of cleanup
afterEach(() => {
    // Clear rendered components using Testing Library
    // This is the recommended approach instead of manipulating the DOM directly
    jest.clearAllMocks();
});

describe('ModDashboard Component', () => {
    test('renders the dashboard with "Manage Users" tab active by default', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Check if sidebar buttons are rendered
        expect(screen.getByText('Manage Users')).toBeInTheDocument();
        expect(screen.getByText('Manage Posts')).toBeInTheDocument();
        expect(screen.getByText('Manage Tickets')).toBeInTheDocument();
        expect(screen.getByText('Manage Tags')).toBeInTheDocument();

        // Check if ManageUsers component is rendered by default
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();
    });

    test('can switch between different tabs', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Default tab is ManageUsers
        expect(screen.getByTestId('manage-users')).toBeInTheDocument();

        // Click on Manage Posts tab
        fireEvent.click(screen.getByText('Manage Posts'));
        expect(screen.getByTestId('manage-posts')).toBeInTheDocument();

        // Click on Manage Tickets tab
        fireEvent.click(screen.getByText('Manage Tickets'));
        expect(screen.getByTestId('manage-tickets')).toBeInTheDocument();

        // Click on Manage Tags tab
        fireEvent.click(screen.getByText('Manage Tags'));
        expect(screen.getByTestId('manage-tags')).toBeInTheDocument();
    });

    test('renders additional admin-only tabs for admin users', () => {
        const adminUser = {
            uid: 'admin1',
            displayName: 'Admin',
            role: 'admin'
        };

        renderWithUserContext(adminUser);

        // Check if admin-only sidebar buttons are rendered
        expect(screen.getByText('Manage Healer Applications')).toBeInTheDocument();
        expect(screen.getByText('Edit FAQ')).toBeInTheDocument();
        expect(screen.getByText('Edit Resources FAQ')).toBeInTheDocument();
        expect(screen.getByText('Edit TOS')).toBeInTheDocument();
        expect(screen.getByText('Manage CEO Videos')).toBeInTheDocument();
        expect(screen.getByText('Manage Admins & Mods')).toBeInTheDocument();

        // Click on an admin-only tab
        fireEvent.click(screen.getByText('Manage Healer Applications'));
        expect(screen.getByTestId('manage-healers')).toBeInTheDocument();

        // Click on another admin-only tab
        fireEvent.click(screen.getByText('Manage Admins & Mods'));
        expect(screen.getByTestId('manage-mods')).toBeInTheDocument();
    });

    test('does not render admin-only tabs for moderator users', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Check that admin-only buttons are not rendered
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit FAQ')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit Resources FAQ')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit TOS')).not.toBeInTheDocument();
        expect(screen.queryByText('Manage CEO Videos')).not.toBeInTheDocument();
        expect(screen.queryByText('Manage Admins & Mods')).not.toBeInTheDocument();
    });

    test('renders correctly when user is not logged in or has no role', () => {
        // User without role
        const userWithoutRole = {
            uid: 'user1',
            displayName: 'Regular User'
        };

        renderWithUserContext(userWithoutRole);

        // Basic tabs should be visible even without role
        expect(screen.getByText('Manage Users')).toBeInTheDocument();

        // No admin tabs
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();
    });

    test('ensures admin-only content is not rendered for non-admin users', () => {
        // Simulate a moderator user selecting an admin tab
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Use fireEvent to click a non-admin tab first
        fireEvent.click(screen.getByText('Manage Users'));

        // Verify admin content is not visible
        expect(screen.queryByTestId('manage-healers')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manage-faq')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manage-resource-faq')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manage-tos')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manage-ceo-video')).not.toBeInTheDocument();
        expect(screen.queryByTestId('manage-mods')).not.toBeInTheDocument();
    });

    test('all admin tabs render correct components for admin users', () => {
        const adminUser = {
            uid: 'admin1',
            displayName: 'Admin',
            role: 'admin'
        };

        renderWithUserContext(adminUser);

        // Test each admin tab to ensure it renders the correct component

        // 1. Manage Healer Applications
        fireEvent.click(screen.getByText('Manage Healer Applications'));
        expect(screen.getByTestId('manage-healers')).toBeInTheDocument();

        // 2. Edit FAQ
        fireEvent.click(screen.getByText('Edit FAQ'));
        expect(screen.getByTestId('manage-faq')).toBeInTheDocument();

        // 3. Edit Resources FAQ
        fireEvent.click(screen.getByText('Edit Resources FAQ'));
        expect(screen.getByTestId('manage-resource-faq')).toBeInTheDocument();

        // 4. Edit TOS
        fireEvent.click(screen.getByText('Edit TOS'));
        expect(screen.getByTestId('manage-tos')).toBeInTheDocument();

        // 5. Manage CEO Videos
        fireEvent.click(screen.getByText('Manage CEO Videos'));
        expect(screen.getByTestId('manage-ceo-video')).toBeInTheDocument();

        // 6. Manage Admins & Mods
        fireEvent.click(screen.getByText('Manage Admins & Mods'));
        expect(screen.getByTestId('manage-mods')).toBeInTheDocument();
    });

    test('isAdmin helper function works correctly with different user roles', () => {
        // Test with admin user
        const adminUser = {
            uid: 'admin1',
            displayName: 'Admin',
            role: 'admin'
        };
        renderWithUserContext(adminUser);
        expect(screen.getByText('Manage Healer Applications')).toBeInTheDocument();

        // Clear previous render
        document.body.innerHTML = '';

        // Test with moderator user
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };
        renderWithUserContext(moderatorUser);
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();

        // Clear previous render
        document.body.innerHTML = '';

        // Test with user who has no role
        const regularUser = {
            uid: 'user1',
            displayName: 'Regular User'
            // No role specified
        };
        renderWithUserContext(regularUser);
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();

        // Clear previous render
        document.body.innerHTML = '';

        // Test with null user
        renderWithUserContext(null);
        expect(screen.queryByText('Manage Healer Applications')).not.toBeInTheDocument();
    });

    test('handles empty data from Firebase gracefully', () => {
        const moderatorUser = {
            uid: 'mod1',
            displayName: 'Moderator',
            role: 'moderator'
        };

        renderWithUserContext(moderatorUser);

        // Switch to the Tickets tab which should be set up to handle empty data
        fireEvent.click(screen.getByText('Manage Tickets'));

        // Verify component renders even with empty data from Firebase
        expect(screen.getByTestId('manage-tickets')).toBeInTheDocument();

        // Since our mocks are returning empty arrays, this test passes if the component
        // renders without crashing, which we've verified above
    });
});
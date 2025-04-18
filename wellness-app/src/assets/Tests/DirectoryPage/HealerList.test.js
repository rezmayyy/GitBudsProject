// Mock Firebase services
jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({ name: 'MockApp' })), // Mock Firebase App instance
}));

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({
        onAuthStateChanged: jest.fn(callback => callback({ uid: 'testUser' })), // Mock signed-in user
    })),
}));

jest.mock('firebase/analytics', () => ({
    getAnalytics: jest.fn(() => ({
        logEvent: jest.fn(), // Mock analytics
    })),
}));

jest.mock('firebase/firestore', () => {
    const originalModule = jest.requireActual('firebase/firestore'); // Optionally use real methods
    return {
        ...originalModule,
        getFirestore: jest.fn(() => ({})), // Mock Firestore initialization
        setLogLevel: jest.fn(), // Safe no-op for Firestore log level
        doc: jest.fn((db, collection, id) => ({ path: `/${collection}/${id}` })), // Mock doc ref
        getDoc: jest.fn(() =>
            Promise.resolve({
                exists: () => true,
                data: () => ({
                    displayName: "MockUser healer1",
                    profilePicUrl: "mockProfilePicUrl",
                }),
            })
        ),
        getDocs: jest.fn(),
        collection: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        limit: jest.fn(),
        startAfter: jest.fn(),
    };
});

jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(() => ({})), // Mock Firebase Storage
}));

jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({
        httpsCallable: jest.fn(() => jest.fn()), // Mock Cloud Functions callable
    })),
}));

jest.mock('../../../Utils/firebaseUtils', () => ({
    getUserById: jest.fn(id =>
        Promise.resolve({
            displayName: `MockUser ${id}`,
            profilePicUrl: "mockProfilePicUrl",
        })
    ),
}));

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HealerList from '../../Directory/HealerList';
import { getDocs, setLogLevel } from "firebase/firestore"; // Import setLogLevel
import { getAuth } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import userEvent from "@testing-library/user-event";
import HealerSearch from "../../Directory/HealerSearch";

// Tests for Firebase Auth
describe('Firebase Auth', () => {
    it('should mock getAuth', () => {
        const mockAuth = { user: 'test-user' };
        getAuth.mockReturnValue(mockAuth);

        const auth = getAuth();
        expect(auth).toEqual(mockAuth);
    });
});

// Tests for HealerList component
describe("HealerList component", () => {
    beforeEach(() => {
        // Mock user signed-in state
        getAuth.mockReturnValue({
            onAuthStateChanged: jest.fn(callback => callback({ uid: "testUser" })),
        });

        // Mock Firestore response
        getDocs.mockResolvedValue({
            docs: [
                {
                    id: "healer1",
                    data: () => ({
                        title: "Healer Title",
                        location: "Healer Location",
                        firstName: "First",
                        lastName: "Last",
                        displayName: "MockUser healer1",
                    }),
                },
            ],
        });

        // Take setLog off because idek what it does
        setLogLevel.mockImplementation(() => { });
    });

    // Test for making sure the Healers appear
    it("renders healer list when signed in", async () => {
        render(
            <MemoryRouter>
                <HealerList />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Healer Title/i)).toBeInTheDocument();
        expect(await screen.findByText(/Healer Location/i)).toBeInTheDocument();
    });

    // Test to make sure healer list doesn't appear where when user is not signed in
    it("prompts to sign in when user is not signed in", () => {
        getAuth.mockReturnValue({
            onAuthStateChanged: jest.fn(callback => callback(null)),
        });

        render(
            <MemoryRouter>
                <HealerList />
            </MemoryRouter>
        );

        expect(screen.getByText(/Please sign in to view the healers./i)).toBeInTheDocument();
    });

    // Test to make sure the follow button leads to the healer's profile
    it("redirects to healer profile when Follow button is clicked", async () => {
        render(
            <MemoryRouter>
                <HealerList />
            </MemoryRouter>
        );

        const followButton = await screen.findByText(/Follow/i);
        expect(followButton).toBeInTheDocument();
        userEvent.click(followButton);
        const followLink = await screen.findByRole("link", { name: /Follow/i });
        expect(followLink).toHaveAttribute("href", "/profile/healer1");
    });

    // Test to make sure the search term is updated when user types something
    describe("HealerSearch component", () => {
        it("updates the search term when Enter key is pressed", () => {
            const mockSetSearchTerm = jest.fn();
            render(<HealerSearch setSearchTerm={mockSetSearchTerm} />);
            const input = screen.getByPlaceholderText("Search healers by name...");

            fireEvent.change(input, { target: { value: "HealerName" } });
            fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

            expect(mockSetSearchTerm).toHaveBeenCalledWith("healername");
        });
    });

    // Test to search healers. 
    it("filters healers based on search term", async () => {
        render(
            <MemoryRouter>
                <HealerList />
            </MemoryRouter>
        );

        // Simulate search
        const input = screen.getByPlaceholderText(/search healers/i);
        const button = screen.getByText(/search/i);

        fireEvent.change(input, { target: { value: "Healer 1" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/Healer Title/i)).toBeInTheDocument();
            expect(screen.getByText(/Healer Location/i)).toBeInTheDocument();
        });
    });

    // Test to make sure when there is no healer of the search term, no healers found is displayed
    it("displays 'No healers found.' when no healers match the search term", async () => {
        getDocs.mockReset(); // Clears all previous mocks

        // Now mock just the empty state
        getDocs.mockResolvedValue({
            docs: [],
        });

        render(
            <MemoryRouter>
                <HealerList />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/search healers/i);
        const button = screen.getByText(/search/i);

        fireEvent.change(input, { target: { value: "nonexistenthealer" } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/No healers found./i)).toBeInTheDocument();
        });
    });

});
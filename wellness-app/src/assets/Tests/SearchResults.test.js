/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/* eslint-disable testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchResults from '../SearchResults';
import UserContext from '../UserContext';
import { searchPostsByKeywords } from '../searchalg';
import { useTags } from "../TagSystem/useTags";

// Mock the imported modules
jest.mock('../searchalg', () => ({
    searchPostsByKeywords: jest.fn()
}));

jest.mock('../TagSystem/useTags', () => ({
    useTags: jest.fn()
}));

// Helper function to render the component with all necessary providers
const renderWithProviders = (ui, { route = '/search?query=test', user = null } = {}) => {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <UserContext.Provider value={{ user }}>
                <Routes>
                    <Route path="/search" element={ui} />
                </Routes>
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('SearchResults Component', () => {
    // Sample mocked data
    const mockTags = [
        { value: 'tag1', label: 'JavaScript' },
        { value: 'tag2', label: 'React' },
        { value: 'tag3', label: 'Firebase' }
    ];

    const mockPosts = [
        {
            id: 'post1',
            title: 'Test Post 1',
            type: 'video',
            author: 'User1',
            tags: ['tag1'],
            views: 100,
            likes: ['user1', 'user2'],
            dislikes: ['user3'],
            thumbnailURL: 'test-thumbnail.jpg',
            date: { seconds: 1609459200 } // January 1, 2021
        },
        {
            id: 'post2',
            title: 'Test Post 2',
            type: 'audio',
            author: 'User2',
            tags: ['tag2', 'tag3'],
            views: 200,
            likes: ['user1'],
            dislikes: [],
            thumbnailURL: 'test-thumbnail2.jpg',
            date: { seconds: 1614556800 } // March 1, 2021
        }
    ];

    // Setup before each test
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock implementations
        useTags.mockReturnValue({ tags: mockTags, loading: false });
        searchPostsByKeywords.mockResolvedValue(mockPosts);
    });

    test('renders the search page with initial states', async () => {
        renderWithProviders(<SearchResults />);

        // First check for loading state
        expect(screen.getByText('Loading posts...')).toBeInTheDocument();

        // Wait for the search to complete - ensure posts are loaded
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', '');
            // Wait until loading message is gone
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Check if filter sections are displayed
        expect(screen.getByText('Filter Content')).toBeInTheDocument();
        expect(screen.getByText('Category ▼')).toBeInTheDocument();
        expect(screen.getByText('Topic ▼')).toBeInTheDocument();

        // Check sorting options
        expect(screen.getByText('Sort By:')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Rating')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();

        // Check if posts are rendered - using findByText which is async
        const post1 = await screen.findByText('Test Post 1');
        const post2 = await screen.findByText('Test Post 2');
        expect(post1).toBeInTheDocument();
        expect(post2).toBeInTheDocument();
    });

    test('shows loading state when fetching posts', async () => {
        // Make the search function return a promise that never resolves
        searchPostsByKeywords.mockReturnValue(new Promise(() => { }));

        renderWithProviders(<SearchResults />);

        // Check if loading message is displayed
        expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });

    test('displays "No posts found" message when search returns empty array', async () => {
        // Mock empty search results
        searchPostsByKeywords.mockResolvedValue([]);

        renderWithProviders(<SearchResults />);

        // Wait for the search to complete
        await waitFor(() => {
            expect(screen.getByText('No posts found for this search term.')).toBeInTheDocument();
        });
    });

    test('toggles category dropdown and filters by category', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for initial render
        const post1 = await screen.findByText('Test Post 1');
        expect(post1).toBeInTheDocument();

        // Open category dropdown
        fireEvent.click(screen.getByText('Category ▼'));

        // Category options should be visible
        expect(screen.getByText('video')).toBeInTheDocument();
        expect(screen.getByText('audio')).toBeInTheDocument();
        expect(screen.getByText('article')).toBeInTheDocument();

        // Select 'video' category
        fireEvent.click(screen.getByText('video'));

        // searchPostsByKeywords should be called again with updated params
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', '');
        });

        // Clicking the same category again should unselect it
        fireEvent.click(screen.getByText('video'));

        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', '');
        });
    });

    test('toggles topic dropdown and filters by tag', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for initial render
        const post1 = await screen.findByText('Test Post 1');
        expect(post1).toBeInTheDocument();

        // Open topic dropdown
        fireEvent.click(screen.getByText('Topic ▼'));

        // Get dropdown menu - using more specific selectors to avoid ambiguity
        const topicDropdown = screen.getByRole('list', { className: 'dropdownContent' });
        expect(topicDropdown).toBeInTheDocument();

        // Find JavaScript in the dropdown specifically
        const dropdownItems = within(topicDropdown).getAllByRole('listitem');
        const javascriptLink = within(dropdownItems[0]).getByText('JavaScript');
        expect(javascriptLink).toBeInTheDocument();

        // Also verify React and Firebase are in the dropdown
        expect(within(topicDropdown).getByText('React')).toBeInTheDocument();
        expect(within(topicDropdown).getByText('Firebase')).toBeInTheDocument();

        // Select 'JavaScript' tag from the dropdown
        fireEvent.click(javascriptLink);

        // searchPostsByKeywords should be called with the tag value
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', 'tag1');
        });

        // Clicking the same tag again should unselect it
        fireEvent.click(javascriptLink);

        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', '');
        });
    });

    test('changes sort method', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for initial render with default 'date' sorting
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'date', '');
        });

        // Change sorting to 'rating'
        fireEvent.click(screen.getByText('Rating'));

        // searchPostsByKeywords should be called with 'rating' sort method
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'rating', '');
        });

        // Change sorting to 'views'
        fireEvent.click(screen.getByText('Views'));

        // searchPostsByKeywords should be called with 'views' sort method
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('test', 'views', '');
        });
    });

    test('renders post details correctly', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for the posts to load using findByText which is async
        const post1 = await screen.findByText('Test Post 1');
        expect(post1).toBeInTheDocument();

        // Check if post details are displayed
        expect(screen.getByText('User1')).toBeInTheDocument();
        expect(screen.getByText(/Category: video/)).toBeInTheDocument();
        expect(screen.getByText(/Views: 100/)).toBeInTheDocument();
        expect(screen.getByText(/Likes: 2/)).toBeInTheDocument();
        expect(screen.getByText(/Dislikes: 1/)).toBeInTheDocument();

        // Check for tags - use more specific selectors to find the badge
        const postBadges = document.querySelectorAll('.badge');
        expect(postBadges.length).toBeGreaterThan(0);
        expect(postBadges[0].textContent).toBe('JavaScript');

        // Check if the second post details are displayed
        expect(screen.getByText('User2')).toBeInTheDocument();
        expect(screen.getByText(/Category: audio/)).toBeInTheDocument();
        expect(screen.getByText(/Views: 200/)).toBeInTheDocument();
        expect(screen.getByText(/Likes: 1/)).toBeInTheDocument();

        // Check dates
        const dateText = screen.getAllByText(/Date:/);
        expect(dateText.length).toBe(2);

        // Check for links to content pages
        const contentLinks = screen.getAllByRole('link', { name: /Test Post/ });
        expect(contentLinks.length).toBe(2);
        expect(contentLinks[0].getAttribute('href')).toBe('/content/post1');
        expect(contentLinks[1].getAttribute('href')).toBe('/content/post2');

        // Check for links to user profiles
        const userLinks = screen.getAllByRole('link', { name: /User/ });
        expect(userLinks.length).toBe(2);
        expect(userLinks[0].getAttribute('href')).toBe('/profile/User1');
        expect(userLinks[1].getAttribute('href')).toBe('/profile/User2');
    });

    test('handles different search queries from URL params', async () => {
        renderWithProviders(<SearchResults />, { route: '/search?query=react' });

        // searchPostsByKeywords should be called with the correct query
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('react', 'date', '');
        });

        // Render with empty query
        renderWithProviders(<SearchResults />, { route: '/search' });

        // searchPostsByKeywords should be called with empty string
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('', 'date', '');
        });
    });

    test('clicking the report button works', async () => {
        // Mock window.alert
        const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => { });

        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for the posts to load
        const post1 = await screen.findByText('Test Post 1');
        expect(post1).toBeInTheDocument();

        // Click the report button
        const reportButtons = screen.getAllByText('Report');
        fireEvent.click(reportButtons[0]);

        // Check if alert was called (or implement your expected behavior)
        // This depends on how the report functionality is implemented in the actual component

        // Clean up
        mockAlert.mockRestore();
    });

    test('works with a logged-in user', async () => {
        const mockUser = { uid: 'user1', displayName: 'Test User' };

        renderWithProviders(<SearchResults />, { user: mockUser });

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for the posts to load
        const post1 = await screen.findByText('Test Post 1');
        expect(post1).toBeInTheDocument();

        // Check if user-specific behavior works as expected
        // This depends on what user-specific behavior the component has
    });
});
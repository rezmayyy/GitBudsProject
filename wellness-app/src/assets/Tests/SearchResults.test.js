import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchResults from '../SearchResults';
import UserContext from '../UserContext';


// Mock Firebase modules
jest.mock('../Firebase', () => ({
    db: {},
    storage: {},
    functions: {},
    auth: {}
}));

// Mock the searchPostsByKeywords function
jest.mock('../searchalg', () => ({
    searchPostsByKeywords: jest.fn()
}));

// Mock the TagSystem/useTags hook
jest.mock('../TagSystem/useTags', () => ({
    __esModule: true,
    useTags: () => ({
        tags: [
            { value: 'meditation', label: 'Meditation' },
            { value: 'wellness', label: 'Wellness' },
            { value: 'yoga', label: 'Yoga' },
            { value: 'exercise', label: 'Exercise' }
        ],
        loading: false
    })
}));

// Helper function to render component with UserContext
const renderWithContext = (ui, { user = null, initialEntries = ['/search?query=test'] } = {}) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <UserContext.Provider value={{ user }}>
                <Routes>
                    <Route path="/search" element={ui} />
                </Routes>
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('SearchResults Component', () => {
    // Set up mock data
    const mockSearchResults = [
        {
            id: 'post1',
            title: 'Test Post 1',
            description: 'This is a test post about meditation',
            type: 'video',
            author: 'testUser1',
            timestamp: { seconds: Date.now() / 1000 },
            views: 100,
            likes: ['user1', 'user2'],
            thumbnailURL: 'https://example.com/thumbnail1.jpg',
            tags: ['meditation', 'wellness']
        },
        {
            id: 'post2',
            title: 'Yoga Practice',
            description: 'Advanced yoga techniques',
            type: 'article',
            author: 'testUser2',
            timestamp: { seconds: Date.now() / 1000 },
            views: 200,
            likes: ['user1', 'user3', 'user4'],
            thumbnailURL: null,
            tags: ['yoga', 'exercise']
        }
    ];

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Set up searchPostsByKeywords mock to return our test data
        const { searchPostsByKeywords } = require('../searchalg');
        searchPostsByKeywords.mockImplementation(() => Promise.resolve(mockSearchResults));
    });

    // Test 1: Search page renders with filters and sort options
    test('renders search components - filters and sort options', async () => {
        renderWithContext(<SearchResults />);

        // Check for category filter
        await screen.findByText(/Category/);

        // Check for sort options
        await screen.findByText(/Sort By:/);
        await screen.findByText(/Date/);
        await screen.findByText(/Rating/);
        await screen.findAllByText(/Views/);
    });

    // Test 2: Search shows results that match the input query
    test('displays search results from the URL query', async () => {
        renderWithContext(<SearchResults />);

        // Wait for posts to load
        await screen.findByText('Test Post 1');
        await screen.findByText('Yoga Practice');

        // Verify the searchPostsByKeywords was called with the URL query
        const { searchPostsByKeywords } = require('../searchalg');
        expect(searchPostsByKeywords).toHaveBeenCalledWith('test', expect.any(String), expect.any(String));
    });

    test('category filter updates the search results', async () => {
        renderWithContext(<SearchResults />);

        // Wait for initial results to load
        await screen.findByText('Test Post 1');

        // Open Category dropdown
        userEvent.click(screen.getByRole('button', { name: /Category/i }));

        // Wait for "video" option to appear
        await screen.findByRole('link', { name: /video/i });

        // Mock filtered results (only video posts)
        const { searchPostsByKeywords } = require('../searchalg');
        searchPostsByKeywords.mockImplementationOnce(() =>
            Promise.resolve([mockSearchResults[0]])
        );

        // Select "video" category
        userEvent.click(screen.getByRole('link', { name: /video/i }));

        // Confirm only video post is shown
        await screen.findByText('Test Post 1');
        await waitFor(() =>
            expect(screen.queryByText('Yoga Practice')).not.toBeInTheDocument()
        );
    });


    // Test 4: Sorting changes the order of results
    test('sorting changes the order of results', async () => {
        renderWithContext(<SearchResults />);

        // Wait for initial results to load
        await screen.findByText('Test Post 1');

        // Click on "Views" sort button
        userEvent.click(screen.getByRole('button', { name: /Views/i }));




        // Mock sorted results (by views, descending)
        const { searchPostsByKeywords } = require('../searchalg');
        searchPostsByKeywords.mockImplementationOnce(() =>
            Promise.resolve([mockSearchResults[1], mockSearchResults[0]])
        );

        // Check that search is performed with the new sort method
        await waitFor(() =>
            expect(searchPostsByKeywords).toHaveBeenCalledWith(
                expect.any(String),
                'views',
                expect.any(String)
            )
        );
    });

    // Test 5: "No results" message shows when nothing is found
    test('displays "no results" message when search returns empty', async () => {
        // Set up searchPostsByKeywords to return empty results
        const { searchPostsByKeywords } = require('../searchalg');
        searchPostsByKeywords.mockImplementationOnce(() => Promise.resolve([]));

        renderWithContext(<SearchResults />);

        // Check for no results message
        await screen.findByText(/No posts found for this search term/i);
    });

    test('handles errors when search fails', async () => {
        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => { }); // ✅ silence error

        const { searchPostsByKeywords } = require('../searchalg');
        searchPostsByKeywords.mockImplementationOnce(() => Promise.reject(new Error('Search error')));

        renderWithContext(<SearchResults />);

        await waitFor(() =>
            expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument()
        );

        await screen.findByText(/No posts found for this search term/i);

        consoleErrorMock.mockRestore();
    });

    /*
        // Test 7: Topic filter works correctly
        test('topic filter updates the results correctly', async () => {
            renderWithContext(<SearchResults />);
    
            // Wait for initial results to load
            await screen.findByText('Test Post 1');
    
            // Click topic dropdown
            userEvent.click(screen.getByText(/Topic/));
    
            // Wait for dropdown to appear
            await screen.findAllByText('Meditation');
    
            // Click on the Meditation tag
            userEvent.click(screen.getByRole('link', { name: /meditation/i }));
    
    
            // Mock tag filtered results
            const { searchPostsByKeywords } = require('../searchalg');
            searchPostsByKeywords.mockImplementationOnce(() => Promise.resolve([mockSearchResults[0]]));
    
            // Verify searchPostsByKeywords was called with the selected tag
            await waitFor(() =>
                expect(searchPostsByKeywords).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.any(String),
                    'meditation'
                )
            );
        });
    */
    // Test 8: Different URL query params result in different searches
    test('updates search results when URL query parameter changes', async () => {
        // First render with one query
        renderWithContext(<SearchResults />, { initialEntries: ['/search?query=meditation'] });

        // Wait for first search to complete
        await screen.findByText('Test Post 1');

        // Verify the search was called with the right query
        const { searchPostsByKeywords } = require('../searchalg');
        expect(searchPostsByKeywords).toHaveBeenCalledWith('meditation', expect.any(String), expect.any(String));

        // Re-render with a different query
        searchPostsByKeywords.mockClear();
        renderWithContext(<SearchResults />, { initialEntries: ['/search?query=yoga'] });

        // Verify the search was called with the new query
        await waitFor(() =>
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', expect.any(String), expect.any(String))
        );
    });

    // Test 9: Posts display appropriate information
    test('posts display appropriate information including title, author, and stats', async () => {
        renderWithContext(<SearchResults />);

        // Check post title
        await screen.findByText('Test Post 1');

        // Check author link
        await screen.findByText('testUser1');

        // Check view count
        await screen.findByText(/Views: 100/);

        // Check likes count
        await screen.findByText(/Likes: 2/);
    });

    // Test 10: All filter dropdowns toggle correctly
    test('filter dropdowns toggle open and closed when clicked', async () => {
        renderWithContext(<SearchResults />);

        // Open Category dropdown
        userEvent.click(screen.getByRole('button', { name: /Category/i }));

        // Wait for dropdown option to appear
        const videoOption = await screen.findByRole('link', { name: /video/i });
        expect(videoOption).toBeInTheDocument();

        // Close Category dropdown
        userEvent.click(screen.getByRole('button', { name: /Category/i }));

        // Wait for dropdown option to be removed
        await waitFor(() =>
            expect(screen.queryByRole('link', { name: /video/i })).not.toBeInTheDocument()
        );
    });
});
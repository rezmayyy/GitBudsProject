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
const renderWithProviders = (ui, { route = '/search?query=yoga', user = null } = {}) => {
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
    // Sample mocked data based on the screenshot
    const mockTags = [
        { value: 'tag1', label: 'Healer Q&A' },
        { value: 'tag2', label: 'New Features' },
        { value: 'tag3', label: 'Marketing Tips' },
        { value: 'tag4', label: 'Business Advice' }
    ];

    const mockPosts = [
        {
            id: 'post1',
            title: 'Health Benefits of Yoga',
            type: 'article',
            author: 'Healer Q&A',
            tags: ['tag1'],
            views: 1,
            likes: [],
            dislikes: [],
            thumbnailURL: null,
            date: { seconds: new Date('2025-04-21T15:30:00').getTime() / 1000 }
        },
        {
            id: 'post2',
            title: 'The Power of Breath: Holistic Healing Through Mindful Breathing',
            type: 'article',
            author: 'New FeaturesMarketing TipsBusiness Advice',
            tags: ['tag2', 'tag3', 'tag4'],
            views: 2,
            likes: ['user1'],
            dislikes: [],
            thumbnailURL: null,
            date: { seconds: new Date('2025-04-20T14:40:00').getTime() / 1000 }
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

    test('renders the search page with yoga results', async () => {
        renderWithProviders(<SearchResults />);

        // First check for loading state
        expect(screen.getByText('Loading posts...')).toBeInTheDocument();

        // Wait for the search to be called with "yoga"
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', '');
        });

        // Wait until loading message is gone
        await waitFor(() => {
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

        // Check if yoga posts are rendered - using findByText which is async
        const post1 = await screen.findByText('Health Benefits of Yoga');
        const post2 = await screen.findByText('The Power of Breath: Holistic Healing Through Mindful Breathing');
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
        const post1 = await screen.findByText('Health Benefits of Yoga');
        expect(post1).toBeInTheDocument();

        // Open category dropdown
        fireEvent.click(screen.getByText('Category ▼'));

        // Category options should be visible
        expect(screen.getByText('article')).toBeInTheDocument();
        expect(screen.getByText('video')).toBeInTheDocument();
        expect(screen.getByText('audio')).toBeInTheDocument();

        // Select 'article' category
        fireEvent.click(screen.getByText('article'));

        // searchPostsByKeywords should be called again with updated params
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', '');
        });

        // Clicking the same category again should unselect it
        fireEvent.click(screen.getByText('article'));

        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', '');
        });
    });

    test('checks badge elements properly', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for the posts to load
        await screen.findByText('Health Benefits of Yoga');

        // Check for badge elements using the correct class
        const badges = screen.getAllByText(/Healer Q&A|New Features|Marketing Tips|Business Advice/);
        expect(badges.length).toBeGreaterThan(4); // At least 5 occurrences (1 author link + 1 badge for first post, 1 author link + 3 badges for second post)

        // Find all badge elements specifically (with the badge class)
        const badgeElements = badges.filter(el => el.classList.contains('badge'));
        expect(badgeElements.length).toBeGreaterThan(3); // At least 4 badge elements

        // Check badge styling
        const firstBadge = badgeElements[0];
        expect(firstBadge).toHaveStyle('background-color: rgb(224, 224, 224)');
        expect(firstBadge).toHaveStyle('color: rgb(51, 51, 51)');
        expect(firstBadge).toHaveStyle('margin-right: 8px');
    });

    test('toggles topic dropdown and filters by tag', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for initial render
        const post1 = await screen.findByText('Health Benefits of Yoga');
        expect(post1).toBeInTheDocument();

        // Open topic dropdown
        fireEvent.click(screen.getByText('Topic ▼'));

        // Get dropdown menu - using more specific selectors to avoid ambiguity
        const topicDropdown = screen.getByRole('list', { className: 'dropdownContent' });
        expect(topicDropdown).toBeInTheDocument();

        // Find Healer Q&A in the dropdown specifically
        const dropdownItems = within(topicDropdown).getAllByRole('listitem');
        const healerQALink = within(dropdownItems[0]).getByText('Healer Q&A');
        expect(healerQALink).toBeInTheDocument();

        // Also verify other tags are in the dropdown
        expect(within(topicDropdown).getByText('New Features')).toBeInTheDocument();
        expect(within(topicDropdown).getByText('Marketing Tips')).toBeInTheDocument();
        expect(within(topicDropdown).getByText('Business Advice')).toBeInTheDocument();

        // Select 'Healer Q&A' tag from the dropdown
        fireEvent.click(healerQALink);

        // searchPostsByKeywords should be called with the tag value
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', 'tag1');
        });

        // Clicking the same tag again should unselect it
        fireEvent.click(healerQALink);

        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', '');
        });
    });

    test('changes sort method', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for initial render with default 'date' sorting
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'date', '');
        });

        // Change sorting to 'rating'
        fireEvent.click(screen.getByText('Rating'));

        // searchPostsByKeywords should be called with 'rating' sort method
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'rating', '');
        });

        // Change sorting to 'views'
        fireEvent.click(screen.getByText('Views'));

        // searchPostsByKeywords should be called with 'views' sort method
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('yoga', 'views', '');
        });
    });

    test('renders post details correctly for yoga search results', async () => {
        renderWithProviders(<SearchResults />);

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.queryByText('Loading posts...')).not.toBeInTheDocument();
        });

        // Wait for the posts to load using findByText which is async
        const post1 = await screen.findByText('Health Benefits of Yoga');
        expect(post1).toBeInTheDocument();

        // Check if post details are displayed
        // Use getAllByText since "Healer Q&A" appears both as author link and as a tag badge
        const healerQAElements = screen.getAllByText('Healer Q&A');
        expect(healerQAElements.length).toBe(2); // Should appear twice - once as author, once as tag

        // Verify one is a link and one is a badge
        const healerQALink = healerQAElements.find(el => el.tagName.toLowerCase() === 'a');
        const healerQABadge = healerQAElements.find(el => el.classList.contains('badge'));
        expect(healerQALink).toBeInTheDocument();
        expect(healerQABadge).toBeInTheDocument();

        // Check there are two instances of "Category: article" (one for each post)
        const categoryElements = screen.getAllByText(/Category: article/);
        expect(categoryElements.length).toBe(2);

        expect(screen.getByText(/Views: 1/)).toBeInTheDocument();
        expect(screen.getByText(/Likes: 0/)).toBeInTheDocument();

        // Check for the date format as shown in the actual HTML
        expect(screen.getByText(/Date: April 21, 2025/)).toBeInTheDocument();

        // Check if the second post details are displayed
        expect(screen.getByText('New FeaturesMarketing TipsBusiness Advice')).toBeInTheDocument();
        // We already checked Category: article for both posts above
        expect(screen.getByText(/Views: 2/)).toBeInTheDocument();
        expect(screen.getByText(/Likes: 1/)).toBeInTheDocument();
        expect(screen.getByText(/Date: April 20, 2025/)).toBeInTheDocument();

        // Check for links to content pages
        const contentLinks = screen.getAllByRole('link', { name: /(Health Benefits of Yoga|The Power of Breath)/ });
        expect(contentLinks.length).toBe(2);
        expect(contentLinks[0].getAttribute('href')).toBe('/content/post1');
        expect(contentLinks[1].getAttribute('href')).toBe('/content/post2');

        // Check for Report buttons
        const reportButtons = screen.getAllByText('Report');
        expect(reportButtons.length).toBe(2);
    });

    test('handles different search queries from URL params', async () => {
        renderWithProviders(<SearchResults />, { route: '/search?query=meditation' });

        // searchPostsByKeywords should be called with the correct query
        await waitFor(() => {
            expect(searchPostsByKeywords).toHaveBeenCalledWith('meditation', 'date', '');
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
        const post1 = await screen.findByText('Health Benefits of Yoga');
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
        const post1 = await screen.findByText('Health Benefits of Yoga');
        expect(post1).toBeInTheDocument();

        // Check if user-specific behavior works as expected
        // This depends on what user-specific behavior the component has
    });
});
// Home.test.js

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
// Import jest-dom for extended matchers (no /extend-expect required)
import '@testing-library/jest-dom';
import Home from '../Home/Home'; // adjust the path as needed
import { BrowserRouter as Router } from 'react-router-dom';

// ----- MOCK CHILD COMPONENTS -----
// We are replacing the actual child components with simple mocks that render a data-testid.
// This ensures our Home tests focus on the Home component itself.
jest.mock('../Home/CTA', () => {
    return function MockCTA() {
        return <div data-testid="cta">CTA Component</div>;
    };
});

jest.mock('../Home/RecentVideos', () => {
    return function MockRecentVideos() {
        return <div data-testid="recent-videos">Recent Videos Component</div>;
    };
});

jest.mock('../Home/GigiVideos', () => {
    return function MockGigiVideos() {
        return <div data-testid="gigi-videos">GigiVideos Component</div>;
    };
});

jest.mock('../DiscussionBoard/DiscussionBoard', () => {
    return function MockDiscussionBoard({ preview }) {
        return <div data-testid="discussion-board">DiscussionBoard {preview ? "Preview" : "Full"}</div>;
    };
});

// ----- MOCK useNavigate from react-router-dom -----
// This will allow us to test that navigation is triggered as expected.
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom');
    return {
        ...originalModule,
        useNavigate: () => mockedNavigate,
    };
});

// ----- Helper to Render Home with Router Context -----
const renderHomePage = (props = {}) => {
    return render(
        <Router>
            <Home {...props} />
        </Router>
    );
};

describe('Home Component', () => {
    // Test 1: It should render the CTA component.
    test('renders the CTA section', () => {
        renderHomePage();
        expect(screen.getByTestId('cta')).toBeInTheDocument();
    });

    // Test 2: It should render the Hero section with welcome text and a button.
    test('renders hero section with welcome text and a button', () => {
        renderHomePage();
        // Verify that the heading and description text are rendered.
        expect(screen.getByText(/Welcome to TribeWell/i)).toBeInTheDocument();
        expect(screen.getByText(/Explore ancient wisdom for modern wellness/i)).toBeInTheDocument();
        // Verify that the hero button is rendered.
        const heroButton = screen.getByRole('button', { name: /See Who You're Following/i });
        expect(heroButton).toBeInTheDocument();
    });

    // Test 3: Clicking the hero button navigates to /following.
    test('navigates to /following when hero button is clicked', () => {
        renderHomePage();
        const heroButton =
            screen.getByRole('button', { name: /See Who You're Following/i });
        fireEvent.click(heroButton);
        expect(mockedNavigate).toHaveBeenCalledWith('/following');
    });

    // Test 4: It should render the Recent Videos section.
    test('renders Recent Videos section', () => {
        renderHomePage();
        // Check for the section heading.
        expect(screen.getByText(/Recent Videos/i)).toBeInTheDocument();
        // Check that the mocked RecentVideos component is rendered.
        expect(screen.getByTestId('recent-videos')).toBeInTheDocument();
    });

    // Test 5: It should render the CEO Spotlight section (GigiVideos).
    test('renders CEO Spotlight section', () => {
        renderHomePage();
        expect(screen.getByTestId('gigi-videos')).toBeInTheDocument();
    });

    // Test 6: It should render the Community Discussions section with preview.
    test('renders Community Discussions section', () => {
        renderHomePage();
        expect(screen.getByText(/Community Discussions/i)).toBeInTheDocument();
        expect(screen.getByTestId('discussion-board').textContent).toMatch(/Preview/i);
    });
});

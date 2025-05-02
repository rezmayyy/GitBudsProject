// Home.test.js
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../Home/Home';
import { BrowserRouter as Router } from 'react-router-dom';


// ─── MOCK useNavigate ────────────────────────────────────────────────────
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const orig = jest.requireActual('react-router-dom');
    return {
        ...orig,
        useNavigate: () => mockedNavigate,
    };
});

// ─── MOCK CHILDREN ────────────────────────────────────────────────────────
jest.mock('../Home/CTA', () => () => <div data-testid="cta" />);
jest.mock('../Home/RecentVideos', () => () => <div data-testid="recent-videos" />);
jest.mock('../Home/GigiVideos', () => () => <div data-testid="gigi-videos" />);
jest.mock(
    '../DiscussionBoard/DiscussionBoard',
    () => ({ preview }) => (
        <div data-testid="discussion-board" data-preview={preview ? 'true' : 'false'} />
    )
);

// ─── TEST SUITE ───────────────────────────────────────────────────────────
describe('Home Component', () => {
    beforeEach(() => {
        mockedNavigate.mockReset();
    });

    const renderHome = () =>
        render(
            <Router>
                <Home posts={[]} setPosts={jest.fn()} />
            </Router>
        );

    test('renders the CTA section', () => {
        renderHome();
        expect(screen.getByTestId('cta')).toBeInTheDocument();
    });

    test('renders hero section with heading, subtext, and button', () => {
        renderHome();
        expect(
            screen.getByRole('heading', { level: 1, name: /welcome to tribewell/i })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/explore ancient wisdom for modern wellness/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /see who you're following/i })
        ).toBeInTheDocument();
    });

    test("navigates to /following when hero button is clicked", () => {
        renderHome();
        fireEvent.click(
            screen.getByRole('button', { name: /see who you're following/i })
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/following');
    });

    test('renders Recent Videos section', () => {
        renderHome();
        expect(
            screen.getByRole('heading', { level: 2, name: /recent videos/i })
        ).toBeInTheDocument();
        expect(screen.getByTestId('recent-videos')).toBeInTheDocument();
    });

    test('renders CEO Spotlight section', () => {
        renderHome();
        expect(screen.getByTestId('gigi-videos')).toBeInTheDocument();
    });

    test('renders Community Discussions section with preview prop', () => {
        renderHome();
        expect(
            screen.getByRole('heading', { level: 2, name: /community discussions/i })
        ).toBeInTheDocument();
        expect(screen.getByTestId('discussion-board')).toHaveAttribute(
            'data-preview',
            'true'
        );
    });
});
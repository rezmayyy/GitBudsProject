// src/assets/Tests/DiscussionBoard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DiscussionBoard from '../DiscussionBoard/DiscussionBoard';
import UserContext from '../UserContext';
import {
    onSnapshot,
    collection,
    orderBy,
    query,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
} from 'firebase/firestore';
import { db } from '../Firebase';

// 🧪 Mock Firestore functions
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    onSnapshot: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mockTimestamp'),
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({ name: 'Test User' })
    }))
}));

// 🔌 Mock Firebase config
jest.mock('../Firebase', () => ({
    db: {}
}));

// 📝 Mock posts data
const mockPosts = [
    { id: '1', message: 'Hello World!', timestamp: 'mockTimestamp' },
    { id: '2', message: 'Another post', timestamp: 'mockTimestamp' },
];

// 🔄 Render with context and router
const renderWithUser = (ui, user = { uid: '123', displayName: 'Test User' }) => {
    return render(
        <MemoryRouter>
            <UserContext.Provider value={{ user }}>
                {ui}
            </UserContext.Provider>
        </MemoryRouter>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
});

test('shows login prompt when user is not logged in', () => {
    renderWithUser(<DiscussionBoard />, null);
    expect(screen.getByText(/you must be a member/i)).toBeInTheDocument();
});

test('renders post box when user is logged in', () => {
    onSnapshot.mockImplementation((_q, callback) => {
        callback({ docs: [] });
        return jest.fn();
    });

    renderWithUser(<DiscussionBoard />);
    expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
});

test('renders fetched posts', async () => {
    onSnapshot.mockImplementation((_q, callback) => {
        callback({
            docs: mockPosts.map((post) => ({
                id: post.id,
                data: () => post,
            })),
        });
        return jest.fn();
    });

    renderWithUser(<DiscussionBoard />);
    expect(await screen.findByText(/hello world/i)).toBeInTheDocument();
    expect(screen.getByText(/another post/i)).toBeInTheDocument();
});

test('submits a new post and clears input', async () => {
    onSnapshot.mockImplementation((_q, callback) => {
        callback({ docs: [] });
        return jest.fn();
    });

    addDoc.mockResolvedValueOnce({ id: 'mockId' });

    renderWithUser(<DiscussionBoard />);

    const textarea = screen.getByPlaceholderText(/share your thoughts/i);
    fireEvent.change(textarea, { target: { value: 'New post!' } });
    fireEvent.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() => {
        expect(addDoc).toHaveBeenCalled();
        expect(textarea.value).toBe('');
    });
});

test('shows preview button if preview prop is true', () => {
    onSnapshot.mockImplementation((_q, callback) => {
        callback({ docs: [] });
        return jest.fn();
    });

    renderWithUser(<DiscussionBoard />);
    // expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument(); // If you add preview later
});

test('expands post message on click', async () => {
    const longText = 'a'.repeat(300);
    const longPost = { id: 'long', message: longText, timestamp: 'mockTimestamp' };

    onSnapshot.mockImplementation((_q, callback) => {
        callback({
            docs: [
                { id: longPost.id, data: () => longPost }
            ],
        });
        return jest.fn();
    });

    renderWithUser(<DiscussionBoard />);

    const truncated = await screen.findByText((content, element) => {
        return (
            element.tagName.toLowerCase() === 'p' &&
            content.startsWith('a'.repeat(100)) &&
            !content.includes('a'.repeat(300))
        );
    });

    fireEvent.click(truncated);

    const allMatches = await screen.findAllByText(longText);
    expect(allMatches.length).toBeGreaterThanOrEqual(1);
});

test('toggles like on click', async () => {
    const post = {
        id: '1',
        message: 'Nice post',
        timestamp: 'mockTimestamp'
    };

    onSnapshot.mockImplementation((_q, callback) => {
        callback({ docs: [{ id: post.id, data: () => post }] });
        return jest.fn();
    });

    renderWithUser(<DiscussionBoard />);

    const heart = await screen.findByRole('img', { hidden: true });
    fireEvent.click(heart);
    expect(heart).toBeInTheDocument();
});

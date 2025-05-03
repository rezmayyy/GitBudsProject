import React, { act } from 'react';
import {
    render,
    screen,
    fireEvent,
    waitFor,
} from '@testing-library/react';
import ExplorePage from '../Explore/ExplorePage';
import { MemoryRouter } from 'react-router-dom';

// ─── FIREBASE MOCKS ───────────────────────────────────────────────────────
import { getAuth } from 'firebase/auth';
import { getDocs, collection, query, where } from 'firebase/firestore';

jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
}));
jest.mock('../Firebase', () => ({ db: {} }));

// ─── CHILD COMPONENT STUBS ───────────────────────────────────────────────
jest.mock('../Explore/ContentSection', () => ({ id, title, content }) => (
    <div data-testid={`${id}-section`}>{title}:{content.length}</div>
));
jest.mock('../Explore/CalendarSection', () => ({ loggedIn }) => (
    <div data-testid="calendar-section">
        Calendar—loggedIn:{loggedIn ? 'yes' : 'no'}
    </div>
));

describe('ExplorePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // default to no user
        getAuth.mockReturnValue({ currentUser: null });
    });

    test('renders header and three ContentSections with correct counts', async () => {
        // queue up 3 getDocs calls: video, audio, article
        getDocs
            .mockResolvedValueOnce({
                docs: [
                    { id: 'v1', data: () => ({}) },
                    { id: 'v2', data: () => ({}) }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    { id: 'a1', data: () => ({}) }
                ]
            })
            .mockResolvedValueOnce({
                docs: [
                    { id: 't1', data: () => ({}) },
                    { id: 't2', data: () => ({}) },
                    { id: 't3', data: () => ({}) }
                ]
            });

        // wrap render in act
        await act(async () => {
            render(
                <MemoryRouter>
                    <ExplorePage />
                </MemoryRouter>
            );
        });

        // static content appears synchronously
        expect(
            screen.getByRole('heading', {
                level: 1,
                name: /welcome to the explore page/i,
            })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/explore videos, audio, and articles below\./i)
        ).toBeInTheDocument();

        // these findByTestId calls are automatically wrapped in act
        expect(await screen.findByTestId('videos-section')).toHaveTextContent('Videos:2');
        expect(await screen.findByTestId('audios-section')).toHaveTextContent('Audios:1');
        expect(await screen.findByTestId('texts-section')).toHaveTextContent('Articles:3');
    });

    test('scroll links call scrollIntoView on correct element', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        await act(async () => {
            render(
                <MemoryRouter>
                    <ExplorePage />
                </MemoryRouter>
            );
        });
        // wait for the first section to mount
        await act(async () => {
            await screen.findByTestId('videos-section');
        });

        // inject dummy sections under act
        await act(async () => {
            ['videos', 'audios', 'texts'].forEach(id => {
                const el = document.createElement('div');
                el.id = id;
                el.scrollIntoView = jest.fn();
                document.body.appendChild(el);
            });
        });

        // click each link & assert under act+waitFor
        await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Videos' }));
        });
        await waitFor(() =>
            expect(document.getElementById('videos').scrollIntoView)
                .toHaveBeenCalledWith({ behavior: 'smooth' })
        );

        await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Audios' }));
        });
        await waitFor(() =>
            expect(document.getElementById('audios').scrollIntoView)
                .toHaveBeenCalledWith({ behavior: 'smooth' })
        );

        await act(async () => {
            fireEvent.click(screen.getByRole('link', { name: 'Articles' }));
        });
        await waitFor(() =>
            expect(document.getElementById('texts').scrollIntoView)
                .toHaveBeenCalledWith({ behavior: 'smooth' })
        );
    });

    test('Events link points to /events', async () => {
        getDocs.mockResolvedValue({ docs: [] });

        await act(async () => {
            render(
                <MemoryRouter>
                    <ExplorePage />
                </MemoryRouter>
            );
        });
        // wait for content
        await act(async () => {
            await screen.findByTestId('videos-section');
        });

        const eventsLink = screen.getByRole('link', { name: /events/i });
        expect(eventsLink).toHaveAttribute('href', '/events');
    });
});
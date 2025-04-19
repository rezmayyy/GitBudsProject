// Rendering Tests
// Search Bar is in EventSearch.jsx a separate file

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventsPage from '../../Events/EventsPage';
import EventSearch from '../../Events/EventSearch';
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Mock Firebase stuff
jest.mock('../../Firebase', () => ({
    db: {},
}));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({ docs: [] }),
    Timestamp: {
        fromDate: jest.fn(() => ({})),
    },
}));

// Mock Event Search Component
jest.mock('../../Events/EventSearch', () => () => <div data-testid="event-search" />);

// Rendering Tests for Page name, Buttons, Event Categories, and Event Search Bar
describe('EventsPage', () => {
    test('renders page title and buttons', async () => {
        render(
            <BrowserRouter>
                <EventsPage />
            </BrowserRouter>
        );

        expect(screen.getByText(/events & workshops/i)).toBeInTheDocument();
        expect(screen.getByText(/see upcoming events/i)).toBeInTheDocument();
        expect(screen.getByText(/host an event/i)).toBeInTheDocument();
        expect(screen.getByText(/event categories/i)).toBeInTheDocument();
        expect(screen.getByTestId('event-search')).toBeInTheDocument();
        expect(screen.getByText(/Upcoming Events./i)).toBeInTheDocument();
        expect(screen.getByText(/Create Event/i)).toBeInTheDocument();
        // expect(screen.getByText(/No events found./i)).toBeInTheDocument();  // Only when no events are found
    }); // it works but im commenting this out to create a fake event
}); // Rendering test passed for core components on page. They on the page

// Tests to make sure the 'Host Event' button and 'Create Event' button links to create-events page
// Host event button links test
test('host event button links to /create-event', async () => {
    render(
        <MemoryRouter>
            <EventsPage />
        </MemoryRouter>
    );

    const hostEventButton = screen.getByRole('button', { name: /host an event/i });
    const link = hostEventButton.closest('a');
    expect(link).toHaveAttribute('href', '/create-event');
}); // Yup, it passed

// Create Event button links test
test('create event button navigates to /create-event', async () => {
    render(
        <MemoryRouter initialEntries={['/events']}>
            <Routes>
                <Route path="/events" element={<EventsPage />} />
                <Route path="/create-event" element={<div data-testid="create-event-page">Create Event Page</div>} />
            </Routes>
        </MemoryRouter>
    );

    const createEventButton = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(createEventButton);

    expect(await screen.findByTestId('create-event-page')).toBeInTheDocument();
}); // Yup, both buttons link to '/create-event'

// Events from database render test. Mocking the data
import { getDocs } from 'firebase/firestore';

describe('EventsPage Data Rendering', () => {
    test('renders events from Firestore mock', async () => {
        // Event Mocked
        const fakeEvent = {
            id: 'abc123',
            title: 'Test Healing Event',
            description: 'A test event for healing.',
            date: {
                toDate: () => new Date('2025-04-20T10:00:00Z'),
            },
            endTime: '12:00',
            location: 'Zoom',
            eventType: 'Webinar',
            thumbnail: 'https://example.com/thumb.jpg',
            images: [],
        };

        // Mock the getDocs return value
        getDocs.mockResolvedValue({
            docs: [
                {
                    id: fakeEvent.id,
                    data: () => fakeEvent,
                },
            ],
        });

        render(
            <MemoryRouter>
                <EventsPage />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Healing Event/i)).toBeInTheDocument();
            expect(screen.getByText(/A test event for healing/i)).toBeInTheDocument();
            expect(screen.getByText(/Zoom/i)).toBeInTheDocument();
        });
    });
});

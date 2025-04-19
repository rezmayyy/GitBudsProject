import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventDetailsPage from '../../Events/EventDetailsPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';
import { db, auth } from '../../Firebase';

// Mock firebase stuff
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    onSnapshot: jest.fn(),
}));
jest.mock('../../Firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'user123' } },
    functions: {},
}));
jest.mock('firebase/functions', () => ({
    httpsCallable: jest.fn(() => jest.fn()),
}));

// Dummy child components
jest.mock('../../Events/RegistrationForm', () => () => <div>RegistrationForm</div>);
jest.mock('../../Events/ParticipantList', () => () => <div>ParticipantList</div>);

// Fake Event for Event Details Page
describe('EventDetailsPage', () => {
    const fakeEvent = {
        title: 'Test Event',
        description: 'This is a test description.',
        date: new Date('2025-05-01T10:00:00'),
        time: '10:00',
        endTime: '12:00',
        eventType: 'Workshop',
        location: 'Zoom',
        createdBy: 'user123',
        attendees: [{ uid: 'user123' }],
        maxParticipants: 10,
        images: ['https://example.com/image1.jpg'],
    };

    beforeEach(() => {
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => fakeEvent,
        });

        onSnapshot.mockImplementation((_, callback) => {
            callback({ exists: () => true, data: () => fakeEvent });
            return () => { };
        });
    });

    // Rendering Test for loading
    test('renders loading state initially', () => {
        render(
            <MemoryRouter initialEntries={['/events/test-event']}>
                <Routes>
                    <Route path="/events/:eventId" element={<EventDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/loading event details/i)).toBeInTheDocument();
    });

    // Rendering Test for Event Details on Page
    test('renders event details after loading', async () => {
        render(
            <MemoryRouter initialEntries={['/events/test-event']}>
                <Routes>
                    <Route path="/events/:eventId" element={<EventDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
            expect(screen.getByText(/This is a test description/i)).toBeInTheDocument();
            expect(screen.getByText(/Zoom/i)).toBeInTheDocument();
            expect(screen.getByText(/ParticipantList/i)).toBeInTheDocument();
            expect(screen.getByText(/Created by:/i)).toBeInTheDocument();
        });
    });

    // Test to make sure the registration form pops up when clicked
    test('shows registration form when Register button is clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/events/test-event']}>
                <Routes>
                    <Route path="/events/:eventId" element={<EventDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for event to load
        await waitFor(() => {
            expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
        });

        const registerButton = screen.getByRole('button', { name: /Register for Event/i });
        await userEvent.click(registerButton);

        expect(screen.getByText(/RegistrationForm/i)).toBeInTheDocument();
    });

});


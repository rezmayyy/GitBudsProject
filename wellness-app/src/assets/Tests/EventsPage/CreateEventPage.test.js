import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateEventPage from '../../Events/CreateEventPage';
import { MemoryRouter } from 'react-router-dom';

// Mock Firebase
const mockCreateEvent = jest.fn(() => Promise.resolve({ data: { eventId: 'test123' } }));

jest.mock('../../Firebase', () => ({
    auth: { currentUser: { uid: 'mockUser' } },
    functions: {},
}));

jest.mock('firebase/functions', () => ({
    httpsCallable: () => mockCreateEvent,
}));

// Skipping upload images
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Test to make sure event is created when 'Create Event' is clicked
describe('CreateEventPage', () => {
    beforeEach(() => {
        mockCreateEvent.mockClear();
    });

    test('renders form and submits valid event', async () => {
        render(
            <MemoryRouter>
                <CreateEventPage />
            </MemoryRouter>
        );

        // Fill in required fields
        await userEvent.type(screen.getByLabelText(/Title:/i), 'Test Event');
        await userEvent.type(screen.getByLabelText(/Description:/i), 'This is a test description');
        await userEvent.type(screen.getByLabelText(/Date:/i), '2025-04-30');
        await userEvent.type(screen.getByLabelText(/^Time:$/), '10:00');
        await userEvent.type(screen.getByLabelText(/^End Time:$/), '11:00');
        await userEvent.type(screen.getByLabelText(/Location:/i), 'Zoom');
        await userEvent.type(screen.getByLabelText(/Max Participants:/i), '25');

        const submitBtn = screen.getByRole('button', { name: /Create Event/i });
        await userEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockCreateEvent).toHaveBeenCalled();
            const payload = mockCreateEvent.mock.calls[0][0];
            expect(payload.title).toBe('Test Event');
            expect(payload.location).toBe('Zoom');
        });
    });
});

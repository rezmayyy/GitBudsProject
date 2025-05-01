// CreateEventPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateEventPage from '../../Events/CreateEventPage';
import { MemoryRouter } from 'react-router-dom';

// ✅ Mock useNavigate to avoid real routing
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => jest.fn(),
    };
});

// ✅ Mock Firebase to prevent analytics crash
jest.mock('../../Firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'testUser123' } },
    functions: {},
}));

describe('CreateEventPage form validation', () => {
    test('should not submit if required fields are missing', () => {
        render(
            <MemoryRouter>
                <CreateEventPage />
            </MemoryRouter>
        );

        const submitButton = screen.getByRole('button', { name: /Create Event/i });

        // Trigger form submission without filling anything
        fireEvent.click(submitButton);

        // Check that the required fields are still present
        expect(screen.getByLabelText(/Title:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description:/i)).toBeInTheDocument();

        // If you want, assert that no success message or redirect has occurred
        expect(screen.queryByText(/event created/i)).not.toBeInTheDocument();
    });
});

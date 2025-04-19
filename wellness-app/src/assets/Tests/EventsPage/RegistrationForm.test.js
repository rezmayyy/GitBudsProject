import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationForm from '../../Events/RegistrationForm';
import { updateDoc, getDoc } from 'firebase/firestore';

// ✅ Fix: Add all needed Firestore mocks here
jest.mock('firebase/firestore', () => ({
    updateDoc: jest.fn(),
    getDoc: jest.fn(), // ✅ This was missing
    doc: jest.fn(),
    arrayUnion: jest.fn((value) => value), // ✅ Required for updateDoc to work
}));

jest.mock('../../Firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'user123', displayName: 'JohnDoe' } },
}));

describe('RegistrationForm Component Tests', () => {
    const mockEventId = 'event123';
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders RegistrationForm with necessary fields', () => {
        render(<RegistrationForm eventId={mockEventId} onClose={mockOnClose} />);

        expect(screen.getByText(/First Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Last Name/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    test('shows error when required fields are empty', () => {
        render(<RegistrationForm eventId={mockEventId} onClose={mockOnClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
        expect(screen.getByText(/Both fields are required/i)).toBeInTheDocument();
    });

    test('registers user successfully', async () => {
        // ✅ Properly mock getDoc
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
                attendees: [],
                maxParticipants: 10,
            }),
        });

        render(<RegistrationForm eventId={mockEventId} onClose={mockOnClose} />);

        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });

        fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

        await waitFor(() => {
            expect(updateDoc).toHaveBeenCalledTimes(1);
            expect(screen.getByText(/successfully registered/i)).toBeInTheDocument();
        });
    });
});

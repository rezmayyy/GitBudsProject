/**
 * src/assets/Tests/Auth/Login.test.js
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../Auth/Login';
import UserContext from '../../UserContext';
import { MemoryRouter } from 'react-router-dom';

/* ── stub Firebase root ───────────────────────────────────────────── */
jest.mock('../../Firebase', () => ({ auth: {} }));

/* ── firebase/auth mock – expose spy via exported field ────────────── */
jest.mock('firebase/auth', () => {
    const mockSignIn = jest.fn();
    return {
        __esModule: true,
        signInWithEmailAndPassword: mockSignIn,
        /* expose for tests */
        _mockSignIn: mockSignIn,
    };
});

/* (if your code imports firebase/functions) */
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(),
    httpsCallable: jest.fn(() => () => Promise.resolve()),
}));

/* ── mock react‑router navigate ───────────────────────────────────── */
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

/* ── grab the spy AFTER the module is mocked ──────────────────────── */
const { _mockSignIn: mockSignIn } = jest.requireMock('firebase/auth');

/* helper renderer */
const renderLogin = (ctx = { setUser: jest.fn() }) =>
    render(
        <MemoryRouter>
            <UserContext.Provider value={ctx}>
                <Login />
            </UserContext.Provider>
        </MemoryRouter>
    );

/* ── tests ─────────────────────────────────────────────────────────── */
describe('<Login />', () => {
    afterEach(() => jest.clearAllMocks());

    it('successful login sets user & navigates to /', async () => {
        const setUser = jest.fn();
        mockSignIn.mockResolvedValueOnce({ user: { uid: '123' } });

        renderLogin({ setUser });

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'user@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'Correct123!' },
        });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith(
                {},
                'user@example.com',
                'Correct123!'
            );
            expect(setUser).toHaveBeenCalledWith({ uid: '123' });
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows generic error message on wrong credentials', async () => {
        mockSignIn.mockRejectedValueOnce({ code: 'auth/wrong-password' });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'bad@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'wrong' },
        });
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(
            await screen.findByText(/invalid email or password/i)
        ).toBeInTheDocument();
    });
});

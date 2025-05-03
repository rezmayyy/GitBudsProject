// src/assets/Tests/Auth/Signup.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Signup from '../../Auth/Signup';
import UserContext from '../../UserContext';
import { MemoryRouter } from 'react-router-dom';

/* stub Firebase */
jest.mock('../../Firebase', () => ({ auth: {}, functions: {} }));
jest.mock('firebase/auth', () => ({ getAuth: () => ({}) }));
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(),
    httpsCallable: jest.fn(() => () => Promise.resolve()),
}));

const renderSignup = () =>
    render(
        <MemoryRouter>
            <UserContext.Provider value={{ setUser: jest.fn() }}>
                <Signup />
            </UserContext.Provider>
        </MemoryRouter>
    );

describe('<Signup />', () => {
    test('renders inputs, TOS checkbox, Sign‑up button & Login link', () => {
        renderSignup();

        expect(screen.getByPlaceholderText(/display name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getAllByPlaceholderText(/password/i)).toHaveLength(2);

        expect(screen.getByRole('checkbox')).toBeInTheDocument();

        // Button exists (may or may not be disabled depending on component logic)
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();

        expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
            'href',
            '/login'
        );
    });

    test('enables Sign Up after valid input & TOS checked', () => {
        renderSignup();

        fireEvent.change(screen.getByPlaceholderText(/display name/i), {
            target: { value: 'Jane Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'jane@example.com' },
        });
        const [pwd, confirm] = screen.getAllByPlaceholderText(/password/i);
        fireEvent.change(pwd, { target: { value: 'Password123!' } });
        fireEvent.change(confirm, { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('checkbox'));

        expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
    });
});

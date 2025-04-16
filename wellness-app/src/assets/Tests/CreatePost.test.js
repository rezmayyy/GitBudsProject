import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreatePost from '../Create/CreatePost';
import UserContext from '../UserContext';

const mockUser = {
    uid: 'test-id',
    displayName: 'Test User'
};

const renderWithContext = (ui, user = mockUser) => {
    return render(
        <MemoryRouter>
            <UserContext.Provider value={{ user }}>
                {ui}
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('CreatePost basic render test', () => {
    test('renders CreatePost component without crashing', () => {
        renderWithContext(<CreatePost />);
        expect(screen.getByText(/What are you uploading/i)).toBeInTheDocument();
    });

    test('renders tab buttons', () => {
        renderWithContext(<CreatePost />);
        expect(screen.getByRole('button', { name: /video/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /article/i })).toBeInTheDocument();
    });
});

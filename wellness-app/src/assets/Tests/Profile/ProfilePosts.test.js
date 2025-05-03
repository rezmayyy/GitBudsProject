import { render, screen } from '@testing-library/react';
import ProfilePosts from '../../Profile/ProfilePosts';
import { MemoryRouter } from 'react-router-dom';

describe('ProfilePosts', () => {
    test('buttons render successfully', () => {
        render(
            <MemoryRouter>
                <ProfilePosts />
            </MemoryRouter>);
        const videoButton = screen.queryByText(/Video/i);
        expect(videoButton).toBeInTheDocument();
        const audioButton = screen.queryByText(/Audio/i);
        expect(audioButton).toBeInTheDocument;
        const articlesButton = screen.queryByText(/Articles/i);
        expect(articlesButton).toBeInTheDocument;
    })
});

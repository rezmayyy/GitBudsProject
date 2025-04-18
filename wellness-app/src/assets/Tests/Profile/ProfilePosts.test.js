import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProfilePosts from '../../Profile/ProfilePosts';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('Profile', () => {
    test('filtering by category works correctly', async () => {
        render(
            <MemoryRouter>
                <ProfilePosts />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Article"));

        await waitFor(() => {
            const articlePosts = screen.getAllByTestId("articlePreview");
            expect(articlePosts.length).toBeGreaterThan(0);
            articlePosts.forEach(post => {
                expect(post.textContent.toLocaleLowerCase()).toContain("read article");
            })
        });

        fireEvent.click(screen.getByText("Audio"));

        await waitFor(() => {
            const audioPosts = screen.getAllByTestId("postCard");
            expect(audioPosts.length).toBeGreaterThan(0);
            videoPosts.forEach(post => {
                expect(post.textContent.toLocaleLowerCase()).toContain("view video");
            })
        });

        fireEvent.click(screen.getByText("Video"));

        await waitFor(() => {
            const videoPosts = screen.getAllByTestId("postCard");
            expect(videoPosts.length).toBeGreaterThan(0);
            videoPosts.forEach(post => {
                expect(post.textContent.toLocaleLowerCase()).toContain("view video");
            })
        });
    });
});

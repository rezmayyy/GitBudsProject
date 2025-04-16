import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Profile from '../../Profile/Profile';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('Profile', () => {
    test('renders successfully, can see the title', () => {
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>);
        const posts = screen.queryByText(/Posts/i);
        expect(posts).toBeInTheDocument();

    });

    test("each profile displays a thumbnail", async () => {
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );
        const wrapper = await waitFor(() => screen.getAllByTestId("profileImageWrapper"));

        const pic = wrapper.getAllByTestId("profilePicturePreview");
        expect(pic).toBeInTheDocument();
    });

    test("each profile displays name", async () => {
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );


        const header = await waitFor(() => screen.getAllByTestId("profileHeader"));

        const nameElement = header.querySelector('[data-testid="name"]');
        expect(nameElement).toBeInTheDocument();
        expect(nameElement.textContent).toMatch(/^[A-Za-z] [AP]M$/); // check format
    });
});

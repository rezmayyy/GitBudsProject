import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CTA from '../Home/CTA';

// Mock the useNavigate function from react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('CTA Component', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        useNavigate.mockReturnValue(mockNavigate);
    });

    test('renders heading and paragraph', () => {
        render(
            <MemoryRouter>
                <CTA />
            </MemoryRouter>
        );

        expect(
            screen.getByRole('heading', { name: /Find Holistic Healers/i })
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Reconnect with your roots and discover/i)
        ).toBeInTheDocument();
    });

    test('renders both buttons with correct text', () => {
        render(
            <MemoryRouter>
                <CTA />
            </MemoryRouter>
        );

        const findBtn = screen.getByRole('button', { name: /Find A Healer/i });
        const joinBtn = screen.getByRole('button', { name: /Join Now/i });

        expect(findBtn).toBeInTheDocument();
        expect(joinBtn).toBeInTheDocument();
        expect(findBtn).toHaveClass('cta-section__btn--primary');
        expect(joinBtn).toHaveClass('cta-section__btn--outline');
    });

    test('clicking "Find A Healer" navigates to /directory', async () => {
        render(
            <MemoryRouter>
                <CTA />
            </MemoryRouter>
        );

        const user = userEvent.setup();
        const findBtn = screen.getByRole('button', { name: /Find A Healer/i });
        await user.click(findBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/directory');
    });

    test('clicking "Join Now" navigates to /membership', async () => {
        render(
            <MemoryRouter>
                <CTA />
            </MemoryRouter>
        );

        const user = userEvent.setup();
        const joinBtn = screen.getByRole('button', { name: /Join Now/i });
        await user.click(joinBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/membership');
    });

    test('renders both images', () => {
        render(
            <MemoryRouter>
                <CTA />
            </MemoryRouter>
        );

        expect(screen.getByAltText(/Holistic Healer Collage/i)).toBeInTheDocument();
        expect(screen.getByAltText(/Customer Logos/i)).toBeInTheDocument();
    });
});

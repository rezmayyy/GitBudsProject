import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchResults from '../SearchResults';
import UserContext from '../UserContext';

// Helper function to render the component with all necessary providers
const renderWithProviders = (ui, { route = '/search?query=yoga', user = null } = {}) => {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <UserContext.Provider value={{ user }}>
                <Routes>
                    <Route path="/search" element={ui} />
                </Routes>
            </UserContext.Provider>
        </MemoryRouter>
    );
};

describe('SearchResults Component', () => {
    test('renders the search page with filter options', () => {
        renderWithProviders(<SearchResults />);

        // Check if filter sections are displayed
        expect(screen.getByRole('heading', { name: /filter content/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /category/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /topic/i })).toBeInTheDocument();
    });

    test('displays sort options', () => {
        renderWithProviders(<SearchResults />);

        // Check sorting options
        expect(screen.getByText(/sort by/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /date/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /rating/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /views/i })).toBeInTheDocument();
    });

    test('changes sort method when clicking sort buttons', () => {
        renderWithProviders(<SearchResults />);

        // Click on different sort methods
        const ratingButton = screen.getByRole('button', { name: /rating/i });
        fireEvent.click(ratingButton);

        const viewsButton = screen.getByRole('button', { name: /views/i });
        fireEvent.click(viewsButton);

        const dateButton = screen.getByRole('button', { name: /date/i });
        fireEvent.click(dateButton);
    });

    test('toggles category dropdown when clicked', () => {
        renderWithProviders(<SearchResults />);

        // Click on category dropdown
        const categoryButton = screen.getByRole('button', { name: /category/i });
        fireEvent.click(categoryButton);

        // Click again to close
        fireEvent.click(categoryButton);
    });

    test('toggles topic dropdown when clicked', () => {
        renderWithProviders(<SearchResults />);

        // Click on topic dropdown
        const topicButton = screen.getByRole('button', { name: /topic/i });
        fireEvent.click(topicButton);

        // Click again to close
        fireEvent.click(topicButton);
    });
});
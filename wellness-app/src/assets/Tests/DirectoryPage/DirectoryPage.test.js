import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { BrowserRouter, Link } from 'react-router-dom';
import DirectoryPage from '../../Directory/DirectoryPage';
import HealerList from '../../Directory/HealerList';
import ProfileCard from '../../Directory/HealerList';
import { getAuth } from 'firebase/auth';
import Firebase from '../../Firebase';

// Render the Directory Page for Join as healer link test
test('renders the "Join as a healer for free" link', () => {
    const { getByText } = render(
        <BrowserRouter>
            <DirectoryPage />
        </BrowserRouter>
    );

    // Check if the link is rendered with the exact text and links to account page
    const healerLink = getByText('Join as a Healer for Free');
    expect(healerLink).toBeInTheDocument();
    expect(healerLink).toHaveAttribute('href', '/account');
});

// Render the DirectoryPage for image links test
test('renders image links correctly', () => {
    const { getByAltText } = render(
        <BrowserRouter>
            <DirectoryPage />
        </BrowserRouter>
    );

    // Check if each image is rendered with the correct alt text
    const image1 = getByAltText('Image 1');
    const image2 = getByAltText('Image 2');
    const image3 = getByAltText('Image 3');

    expect(image1).toBeInTheDocument();
    expect(image1).toHaveAttribute('src', 'Frame1.png');
    expect(image2).toBeInTheDocument();
    expect(image2).toHaveAttribute('src', 'Frame2.png');
    expect(image3).toBeInTheDocument();
    expect(image3).toHaveAttribute('src', 'Frame3.png');
});

// Render the DirectoryPage for testing navigation when image links are clicked
test('navigates to correct paths when image links are clicked', () => {
    const { getByAltText } = render(
        <BrowserRouter>
            <DirectoryPage />
        </BrowserRouter>
    );

    // Simulate clicking each image link and verify navigation
    const image1 = getByAltText('Image 1');
    fireEvent.click(image1);
    expect(window.location.pathname).toBe('/search');

    const image2 = getByAltText('Image 2');
    fireEvent.click(image2);
    expect(window.location.pathname).toBe('/explore');

    const image3 = getByAltText('Image 3');
    fireEvent.click(image3);
    expect(window.location.pathname).toBe('/events');
});

/********** Healer's List **********/
// Rendering Tests
// Render Healer List to test text displays when user is not signed in
test('renders the healer list correctly when not signed in', () => {
    const { getByText } = render(
        <BrowserRouter>
            <HealerList />
        </BrowserRouter>
    );

    // Check if the "Please sign in to view the healers" message is displayed
    expect(getByText('Please sign in to view the healers.')).toBeInTheDocument();
});

// Test to check if the searh bar and heading is rendered
test('renders the heading and search bar', () => {
    const { getByText } = render(
        <BrowserRouter>
            <HealerList />
        </BrowserRouter>
    );

    // Check if the "Meet Our Healers" heading is displayed
    expect(getByText('Meet Our Healers')).toBeInTheDocument();
});


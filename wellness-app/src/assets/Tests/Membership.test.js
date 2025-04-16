// Membership.test.js

// Import React and testing utilities.
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import Membership from '../Membership/Membership'; // Adjust the path as necessary
import UserContext from '../UserContext';
import { BrowserRouter as Router } from 'react-router-dom';

// ----- MOCK FIRESTORE FUNCTIONS -----
// We manually mock the firestore functions so that we can override their implementations in our tests.
jest.mock('firebase/firestore', () => {
    return {
        // The "doc" function is mocked to return an empty object (its value isn’t used by our component).
        doc: jest.fn(() => ({})),
        // "setDoc" returns a resolved promise.
        setDoc: jest.fn(() => Promise.resolve()),
        // "getDoc" is mocked so that we can later override it with mockResolvedValueOnce.
        getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
        // Provide a dummy implementation for getFirestore – used in your Firebase file.
        getFirestore: jest.fn(() => ({})),
        // Provide a dummy implementation for setLogLevel.
        setLogLevel: jest.fn(),
    };
});

// ----- MOCK useNavigate -----
// We want to capture navigation calls (for example, when "Join as a Healer" is clicked).
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
    const actualModule = jest.requireActual('react-router-dom');
    return {
        ...actualModule,
        useNavigate: () => mockedNavigate,
    };
});

// Helper: Renders the Membership component wrapped in a Router and UserContext.
const renderMembershipWithUser = (userValue) => {
    return render(
        <Router>
            <UserContext.Provider value={{ user: userValue }}>
                <Membership />
            </UserContext.Provider>
        </Router>
    );
};

// ----- Global setup for alert and confirm mocks -----
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'alert').mockImplementation(() => { });
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
});
afterEach(() => {
    window.alert.mockRestore();
    window.confirm.mockRestore();
});

describe('Membership Component', () => {
    // Test 1: Ensure that when no user is logged in, the component displays a "Join as a Healer" button
    // and clicking it navigates to "/login".
    test('displays "Join as a Healer" button when user is not logged in and navigates to login on click', async () => {
        renderMembershipWithUser(null);
        // Expect the join button to be present.
        const joinButton = await screen.findByText(/Join as a Healer/i);
        expect(joinButton).toBeInTheDocument();
        // Fire a click event and verify that useNavigate is called with '/login'.
        fireEvent.click(joinButton);
        expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });

    // Test 2: When a logged-in user has no membership plan and free trial is not used, the "Start Free Trial" button should appear.
    test('renders "Start Free Trial" button when no plan is selected and free trial not used', async () => {
        const { getDoc } = require('firebase/firestore');
        // Override getDoc for this test.
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ membershipPlan: null, freeTrialUsed: false }),
        });
        renderMembershipWithUser({ uid: 'testUser' });
        // Wait until the button appears.
        await waitFor(() => {
            expect(screen.getByText(/Start Free Trial/i)).toBeInTheDocument();
        });
    });

    // Test 3: If the user already has a Premium plan, the component should display the current plan label.
    test('displays current plan "Premium" if user already has Premium plan', async () => {
        const { getDoc } = require('firebase/firestore');
        // Simulate that the user document contains the Premium plan.
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ membershipPlan: "Premium", freeTrialUsed: true }),
        });
        renderMembershipWithUser({ uid: 'testUser' });
        await waitFor(() => {
            expect(screen.getByText(/Your current plan: Premium/i)).toBeInTheDocument();
        });
        // Also, expect that a label indicating the Premium membership is visible.
        expect(screen.getByText(/You are a Premium member/i)).toBeInTheDocument();
    });

    // Test 4: Ensure that clicking the "Get Premium" button updates the membership to Premium.
    test('updates membership to Premium when "Get Premium" is clicked', async () => {
        const { getDoc } = require('firebase/firestore');
        // Simulate starting with no membership plan.
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ membershipPlan: null, freeTrialUsed: false }),
        });
        renderMembershipWithUser({ uid: 'testUser' });
        // Wait until the "Start Free Trial" button is visible (indicating no plan).
        await waitFor(() => {
            expect(screen.getByText(/Start Free Trial/i)).toBeInTheDocument();
        });
        // Find the "Get Premium" button and click it.
        const premiumButton = screen.getByText(/Get Premium/i);
        fireEvent.click(premiumButton);
        // Wait for an alert that indicates the user is now Premium.
        await waitFor(() =>
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Premium"))
        );
        // Verify that the UI now displays the Premium membership.
        expect(screen.getByText(/Your current plan: Premium/i)).toBeInTheDocument();
    });

    // Test 5: Canceling membership should reset the plan to Basic (Standard) and remove the cancel button.
    test('canceling membership resets plan to Basic (Standard) and removes the cancel button', async () => {
        const { getDoc } = require('firebase/firestore');
        // Simulate that the user currently has a Premium membership.
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ membershipPlan: "Premium", freeTrialUsed: true }),
        });
        renderMembershipWithUser({ uid: 'testUser' });
        await waitFor(() => {
            expect(screen.getByText(/Your current plan: Premium/i)).toBeInTheDocument();
        });
        // Click the cancel membership button.
        const cancelButton = screen.getByText(/Cancel Membership/i);
        fireEvent.click(cancelButton);
        await waitFor(() =>
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("reset to Basic"))
        );
        // The UI should now show Basic (Standard) as the current plan.
        expect(screen.getByText(/Your current plan: Basic \(Standard\)/i)).toBeInTheDocument();
        // The cancel button should no longer be in the document.
        expect(screen.queryByText(/Cancel Membership/i)).toBeNull();
    });

    // Test 6: When the Basic plan is active, its card should display only a label (no "Get Basic" button).
    test('Basic plan card shows label only when Basic plan is active', async () => {
        const { getDoc } = require('firebase/firestore');
        // Simulate that the user is on the Basic plan.
        getDoc.mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ membershipPlan: "Basic", freeTrialUsed: true }),
        });
        renderMembershipWithUser({ uid: 'testUser' });
        await waitFor(() => {
            expect(screen.getByText(/You are on the Basic plan \(Standard\)/i)).toBeInTheDocument();
        });
        // Ensure the "Get Basic" button is not rendered.
        expect(screen.queryByText(/Get Basic/i)).toBeNull();
    });
});

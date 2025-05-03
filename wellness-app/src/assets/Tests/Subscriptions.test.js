import React from 'react';
import {
    render,
    screen,
    fireEvent,
    waitFor
} from '@testing-library/react';
import Subscriptions from '../Home/Subscriptions';
import UserContext from '../UserContext';
import { MemoryRouter } from 'react-router-dom';

import { getAuth } from 'firebase/auth';
import {
    collection,
    doc,
    deleteDoc,
    onSnapshot,
    getDoc
} from 'firebase/firestore';

// ─── MOCK FIREBASE AUTH & FIRESTORE ───────────────────────────────────────
jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    deleteDoc: jest.fn(),
    onSnapshot: jest.fn(),
    getDoc: jest.fn(),
}));
jest.mock('../Firebase', () => ({ db: {} }));

// ─── STUB DUMMY PIC ────────────────────────────────────────────────────────
// The code does: import dummyPic from '../dummyPic.jpeg'
jest.mock('../dummyPic.jpeg', () => 'dummyPicPath');

// ─── MOCK useNavigate ────────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('<Subscriptions />', () => {
    const fakeUser = { uid: 'u1' };

    beforeEach(() => {
        jest.clearAllMocks();
        getAuth.mockReturnValue({ currentUser: fakeUser });
    });

    it('renders the Following header', () => {
        onSnapshot.mockImplementation(() => () => { });
        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user: fakeUser }}>
                    <Subscriptions />
                </UserContext.Provider>
            </MemoryRouter>
        );
        expect(
            screen.getByRole('heading', { level: 4, name: /following/i })
        ).toBeInTheDocument();
    });

    it('loads two subscriptions and displays their names and pics', async () => {
        onSnapshot.mockImplementation((_, cb) => {
            cb({ docs: [{ id: 'user1' }, { id: 'user2' }] });
            return () => { };
        });

        getDoc
            .mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ displayName: 'Alice', profilePicUrl: 'alice.jpg' }),
            })
            .mockResolvedValueOnce({
                exists: () => false,
            });

        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user: fakeUser }}>
                    <Subscriptions />
                </UserContext.Provider>
            </MemoryRouter>
        );

        expect(await screen.findByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();

        const imgAlice = screen.getByAltText('Alice');
        expect(imgAlice).toHaveAttribute('src', 'alice.jpg');

        const imgUser2 = screen.getByAltText('user2');
        expect(imgUser2).toHaveAttribute('src', 'dummyPicPath');
    });

    it('navigates to /profile/:id when clicking the sub-info wrapper', async () => {
        onSnapshot.mockImplementation((_, cb) => {
            cb({ docs: [{ id: 'user1' }] });
            return () => { };
        });
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ displayName: 'Alice', profilePicUrl: '' }),
        });

        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user: fakeUser }}>
                    <Subscriptions />
                </UserContext.Provider>
            </MemoryRouter>
        );

        const wrapper = await screen.findByText('Alice');
        fireEvent.click(wrapper.closest('.sub-info-wrapper'));
        expect(mockNavigate).toHaveBeenCalledWith('/profile/user1');
    });

    it('calls deleteDoc with the correct ref when clicking Remove', async () => {
        onSnapshot.mockImplementation((_, cb) => {
            cb({ docs: [{ id: 'user1' }] });
            return () => { };
        });
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ displayName: 'Alice', profilePicUrl: '' }),
        });

        const fakeRef = {};
        doc.mockReturnValue(fakeRef);

        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user: fakeUser }}>
                    <Subscriptions />
                </UserContext.Provider>
            </MemoryRouter>
        );

        const removeBtn = await screen.findByRole('button', { name: /remove/i });
        fireEvent.click(removeBtn);

        await waitFor(() => {
            expect(doc).toHaveBeenCalledWith(
                {},
                `users/${fakeUser.uid}/subscriptions`,
                'user1'
            );
            expect(deleteDoc).toHaveBeenCalledWith(fakeRef);
        });
    });
});

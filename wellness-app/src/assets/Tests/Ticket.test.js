// __tests__/Ticket.integration.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { auth, db } from '../Firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    addDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';

import Ticket from '../Ticket/Ticket';
import TicketList from '../Ticket/TicketList';
import UserContext from '../UserContext';

// Extend timeout for integration tests
jest.setTimeout(60000);

// Clean up React DOM after each test
afterEach(() => cleanup());

describe('Integration tests against real Firebase', () => {
    let user;
    const seededDocs = [];

    beforeAll(async () => {
        // Sign in to Firebase Auth with test user
        const credential = await signInWithEmailAndPassword(
            auth,
            'Gitbuds@gmail.com',
            'Tester1!'
        );
        user = credential.user;

        // Seed six test tickets (Test1...Test6)
        for (let i = 1; i <= 6; i++) {
            const ref = await addDoc(collection(db, 'tickets'), {
                title: `Test${i}`,
                description: 'Seed data',
                userId: user.uid,
                category: 'normal',
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            seededDocs.push(ref);
        }
    });

    afterAll(async () => {
        // Cleanup seeded tickets by title (only those belonging to this user)
        const seedTitles = ['Test1', 'Test2', 'Test3', 'Test4', 'Test5', 'Test6'];
        const cleanupQuery = query(
            collection(db, 'tickets'),
            where('userId', '==', user.uid),
            where('title', 'in', seedTitles)
        );
        const cleanupSnap = await getDocs(cleanupQuery);
        await Promise.all(
            cleanupSnap.docs.map((d) => deleteDoc(d.ref))
        );
        // Sign out
        await auth.signOut();
    });

    test('TicketList displays seeded tickets and pagination', async () => {
        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user }}>
                    <TicketList onCreateTicket={() => { }} />
                </UserContext.Provider>
            </MemoryRouter>
        );

        // Wait for page to load and show page indicator
        expect(
            await screen.findByText('Page 1 of 2', {}, { timeout: 20000 })
        ).toBeInTheDocument();

        // Expect the most recent seeded ticket (Test6) to appear first
        const items = await screen.findAllByRole('heading', { level: 4 });
        expect(items[0].textContent).toBe('Test6');
    });

    test('Pagination next/previous works in TicketList', async () => {
        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user }}>
                    <TicketList onCreateTicket={() => { }} />
                </UserContext.Provider>
            </MemoryRouter>
        );

        // Wait for pagination controls
        await screen.findByText('Page 1 of 2', {}, { timeout: 20000 });

        // Navigate to next page and assert
        fireEvent.click(screen.getByText(/Next/i));
        expect(await screen.findByText('Page 2 of 2', {}, { timeout: 20000 })).toBeInTheDocument();

        // Navigate back to first page
        fireEvent.click(screen.getByText(/Previous/i));
        expect(await screen.findByText('Page 1 of 2', {}, { timeout: 20000 })).toBeInTheDocument();
    });

    test('User can create a ticket via UI and then click the top result', async () => {
        const now = Date.now();
        const newTitle = `E2E Ticket ${now}`;
        const newDesc = 'Integration test created this ticket';

        render(
            <MemoryRouter>
                <UserContext.Provider value={{ user }}>
                    <Ticket />
                </UserContext.Provider>
            </MemoryRouter>
        );

        // Open create form
        fireEvent.click(
            await screen.findByText('+ New Ticket', {}, { timeout: 20000 })
        );

        // Fill & submit form
        fireEvent.change(screen.getByPlaceholderText(/Ticket Title/i), {
            target: { value: newTitle },
        });
        fireEvent.change(screen.getByPlaceholderText(/Description/i), {
            target: { value: newDesc },
        });
        fireEvent.click(screen.getByText(/Create Ticket/i));

        // Wait for new ticket and list refresh
        const headings = await screen.findAllByRole('heading', { level: 4 }, { timeout: 30000 });
        // The newest ticket should be at the top
        expect(headings[0].textContent).toBe(newTitle);

        // Click the top result
        fireEvent.click(headings[0]);

        // Assert detail view for that ticket appears
        expect(
            await screen.findByText(newTitle, {}, { timeout: 20000 })
        ).toBeInTheDocument();

        // Cleanup created ticket by title filter
        const cleanupSnap = await getDocs(
            query(
                collection(db, 'tickets'),
                where('userId', '==', user.uid),
                where('title', '==', newTitle)
            )
        );
        await Promise.all(cleanupSnap.docs.map((d) => deleteDoc(d.ref)));
    });
});

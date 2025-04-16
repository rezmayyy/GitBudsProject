// --- Mocks at the top (ensure these are at the very top) ---

// Mock the Firebase module so that our functions export is not empty.
jest.mock('../Firebase', () => ({
    db: {},
    // Return an empty functions object. Our firebase/functions mock below will define httpsCallable.
    functions: {},
}));

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
    const createdAt = { toDate: () => new Date('2024-01-01T00:00:00Z') };
    const ticketData = {
        title: 'Ticket 1',
        description: 'Ticket Description',
        createdAt,
        displayName: 'Regular User',
        staffName: 'Admin User',
        userId: 'user1',
        category: 'normal',
        status: 'assigned',
    };

    return {
        collection: jest.fn((db, path) => ({ db, path })),
        doc: jest.fn((db, coll, id) => ({ db, coll, id, path: `${coll}/${id}` })),
        getDoc: jest.fn((docRef) => {
            console.log('mock getDoc called with:', docRef);
            if (docRef?.path?.startsWith('tickets/')) {
                return Promise.resolve({
                    exists: () => true,
                    id: docRef.id,
                    data: () => ticketData,
                });
            }
            return Promise.resolve({
                exists: () => true,
                data: () => ({ displayName: 'Test User', tier: 'normal' }),
            });
        }),
        getDocs: jest.fn((colRef) => {
            console.log('mock getDocs called with:', colRef);
            if (!colRef?.path) {
                console.error("⚠️ getDocs called with missing path", colRef);
                return Promise.resolve({ docs: [] });
            }
            if (colRef.path.includes('ticketReplies')) {
                return Promise.resolve({
                    docs: [
                        {
                            id: 'reply1',
                            data: () => ({
                                displayName: 'Support Agent',
                                replyText: 'We are looking into this.',
                                createdAt: { toDate: () => new Date('2024-01-02T12:00:00Z') },
                            }),
                        },
                    ],
                });
            }
            if (colRef.path.startsWith('tickets')) {
                const dummyTickets = [
                    {
                        ...ticketData,
                        id: '1',
                        title: 'Ticket 1',
                        staffId: 'admin1',
                        status: 'assigned',
                        createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
                    },
                    {
                        ...ticketData,
                        id: '2',
                        title: 'Ticket 2',
                        staffId: '',
                        status: 'pending',
                        createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
                    },
                    {
                        ...ticketData,
                        id: '3',
                        title: 'Ticket 3',
                        staffId: 'admin1',
                        status: 'closed',
                        createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
                    },
                    {
                        ...ticketData,
                        id: '4',
                        title: 'Ticket 4',
                        category: 'report',
                        status: 'pending',
                        createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
                    },
                    {
                        ...ticketData,
                        id: '5',
                        title: 'Ticket 5',
                        staffId: '',
                        status: 'pending',
                        createdAt: { toDate: () => new Date('2024-01-02T00:00:00Z') },
                    },
                    {
                        ...ticketData,
                        id: '6',
                        title: 'Ticket 6',
                        staffId: '',
                        status: 'pending',
                        createdAt: { toDate: () => new Date('2024-01-02T00:00:00Z') },
                    }
                ];
                return Promise.resolve({
                    docs: dummyTickets.map(ticket => ({
                        id: ticket.id,
                        data: () => ticket,
                        exists: () => true,
                    })),
                });
            }
            return Promise.resolve({ docs: [] });
        }),
        addDoc: jest.fn(() => Promise.resolve({ id: 'newTicketId' })),
        updateDoc: jest.fn(() => Promise.resolve()),
        deleteDoc: jest.fn(() => Promise.resolve()),
        increment: jest.fn((n) => n),
    };
});

// Mock firebase/functions by defining our httpsCallable directly.
jest.mock('firebase/functions', () => ({
    __esModule: true,
    httpsCallable: jest.fn((functions, name) => {
        if (name === 'createTicket') {
            return jest.fn((data) => {
                const { title, description } = data;
                if (!title || !description) {
                    return Promise.reject(new Error("Ticket title and description are required."));
                }
                return Promise.resolve({
                    data: {
                        message: "Ticket created successfully.",
                        ticketId: "123",
                    },
                });
            });
        }
        return jest.fn(() => Promise.resolve({ data: {} }));
    }),
}));

// ---------------------------------------------------------------------
// Now import modules (order is important)
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Import components to test.
import Ticket from '../Ticket/Ticket';
import CreateTicket from '../Ticket/CreateTicket';
import TicketList from '../Ticket/TicketList';
import TicketItem from '../Ticket/TicketItem';
import ViewTicket from '../Ticket/ViewTicket';
import TicketFilters from '../Ticket/TicketFilters';

// Import the user context to provide dummy user info.
import UserContext from '../UserContext';

//
// --- Dummy Users and Render Helper ---
const adminUser = { uid: 'admin1', role: 'admin', displayName: 'Admin User' };
const regularUser = { uid: 'user1', role: 'user', displayName: 'Regular User', tier: 'normal' };

const renderWithUser = (component, user = regularUser) => {
    return render(
        <MemoryRouter>
            <UserContext.Provider value={{ user }}>
                {component}
            </UserContext.Provider>
        </MemoryRouter>
    );
};

//
// --- Tests ---
describe('Ticket System', () => {
    describe('CreateTicket Component', () => {
        test('should display error when required fields are missing', async () => {
            const onSubmittedMock = jest.fn();
            renderWithUser(
                <CreateTicket onCancel={jest.fn()} onSubmitted={onSubmittedMock} />,
                regularUser
            );

            const titleInput = screen.getByPlaceholderText(/Ticket Title/i);
            const descriptionInput = screen.getByPlaceholderText(/Description/i);
            // Leave title empty.
            fireEvent.change(titleInput, { target: { value: '' } });
            fireEvent.change(descriptionInput, { target: { value: 'Ticket Description' } });

            const submitButton = screen.getByText(/Create Ticket/i);
            fireEvent.click(submitButton);
            await waitFor(() => expect(onSubmittedMock).not.toHaveBeenCalled());
        });
    });

    describe('TicketItem Component', () => {
        const dummyTicket = {
            id: 'ticket1',
            title: 'Test Ticket',
            description: 'This is a test ticket',
            userId: 'user1',
            category: 'normal',
            status: 'pending',
        };

        test('should render ticket title and trigger onView when clicked', async () => {
            const onViewMock = jest.fn();
            renderWithUser(
                <TicketItem
                    ticket={dummyTicket}
                    onView={onViewMock}
                    onClaim={jest.fn()}
                    onClose={jest.fn()}
                    view="unassigned"
                    status="pending"
                />,
                regularUser
            );

            expect(screen.getByText(/Test Ticket/i)).toBeInTheDocument();
            fireEvent.click(screen.getByText(/Test Ticket/i));
            expect(onViewMock).toHaveBeenCalledWith(dummyTicket.id);
        });

        test('should trigger onClaim when Claim button is clicked', async () => {
            const onClaimMock = jest.fn();
            renderWithUser(
                <TicketItem
                    ticket={dummyTicket}
                    onView={jest.fn()}
                    onClaim={onClaimMock}
                    onClose={jest.fn()}
                    view="unassigned"
                    status="pending"
                />,
                adminUser
            );

            const claimButton = screen.getByText(/Claim/i);
            await act(async () => {
                fireEvent.click(claimButton);
            });
            expect(onClaimMock).toHaveBeenCalledWith(dummyTicket.id);
        });

        test('should trigger onClose when Close button is clicked', async () => {
            const onCloseMock = jest.fn();
            const assignedTicket = { ...dummyTicket, status: 'assigned', staffId: adminUser.uid };
            renderWithUser(
                <TicketItem
                    ticket={assignedTicket}
                    onView={jest.fn()}
                    onClaim={jest.fn()}
                    onClose={onCloseMock}
                    view="assigned"
                    status="assigned"
                />,
                adminUser
            );

            const closeButton = screen.getByText(/Close/i);
            fireEvent.click(closeButton);
            expect(onCloseMock).toHaveBeenCalledWith(assignedTicket.id);
        });
    });

    describe('TicketList Component', () => {
        const dummyTickets = [
            {
                ...regularUser,
                id: "1",
                title: "Ticket 1",
                staffId: adminUser.uid,
                status: "assigned",
                createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            },
            {
                ...regularUser,
                id: "2",
                title: "Ticket 2",
                staffId: "",
                status: "pending",
                createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            },
            {
                ...regularUser,
                id: "3",
                title: "Ticket 3",
                staffId: adminUser.uid,
                status: "closed",
                createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            },
            {
                ...regularUser,
                id: "4",
                title: "Ticket 4",
                category: "report",
                status: "pending",
                createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            },
            {
                ...regularUser,
                id: "5",
                title: "Ticket 5",
                staffId: "",
                status: "pending",
                createdAt: { toDate: () => new Date('2024-01-02T00:00:00Z') },
            },
            {
                ...regularUser,
                id: "6",
                title: "Ticket 6",
                staffId: "",
                status: "pending",
                createdAt: { toDate: () => new Date('2024-01-02T00:00:00Z') },
            },
        ];

        // Override getDocs for TicketList.
        const { getDocs } = require('firebase/firestore');
        getDocs.mockImplementation(() =>
            Promise.resolve({
                docs: dummyTickets.map(ticket => ({
                    id: ticket.id,
                    data: () => ticket,
                })),
            })
        );

        test('should render tickets for regular user', async () => {
            renderWithUser(<TicketList onCreateTicket={jest.fn()} />, regularUser);
            await waitFor(() =>
                expect(
                    screen.getByText((content, element) =>
                        element.tagName.toLowerCase() === 'h2' && content.includes('Your Tickets')
                    )
                ).toBeInTheDocument()
            );
        });
    });

    describe('TicketFilters Component', () => {
        test('should render filter buttons and disable the current view button', () => {
            const setViewMock = jest.fn();
            render(
                <MemoryRouter>
                    <TicketFilters currentView="assigned" setView={setViewMock} />
                </MemoryRouter>
            );

            const assignedButtons = screen.getAllByText(/Tickets/i);
            const assignedButton = assignedButtons.find(btn => btn.textContent.includes("Assigned"));
            expect(assignedButton).toBeDisabled();

            const unassignedButton = screen.getByText(/Unassigned Tickets/i);
            fireEvent.click(unassignedButton);
            expect(setViewMock).toHaveBeenCalledWith("unassigned");
        });
    });

    describe('Ticket Component', () => {
        test('should switch between ticket list and create ticket form', async () => {
            renderWithUser(<Ticket />, regularUser);
            const ticketListHeading = screen.getByText((content, element) =>
                element.tagName.toLowerCase() === 'h2' && content.includes('Your Tickets')
            );
            expect(ticketListHeading).toBeInTheDocument();

            const newTicketButton = screen.getByText(/\+ New Ticket/i);
            fireEvent.click(newTicketButton);
            expect(screen.getByPlaceholderText(/Ticket Title/i)).toBeInTheDocument();
        });
    });
});

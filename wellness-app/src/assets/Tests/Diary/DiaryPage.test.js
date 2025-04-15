import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import DiaryPage from '../../Diary/DiaryPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';

jest.mock('firebase/auth', () => ({
    getAuth: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    doc: jest.fn()
}));


jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

describe('DiaryPage', () => {
    const mockEntries = [
        {
            id: '1',
            title: 'Entry 1',
            content: '<p>Content for Entry 1</p>',
            createdAt: { seconds: 1000000 },
            userId: 'test-user-123'
        },
        // {
        //     id: '2',
        //     title: 'Entry 2',
        //     content: '<p>Content for Entry 2</p>',
        //     createdAt: { seconds: 2000000 },
        //     userId: 'test-user-123'
        // }
    ];

    beforeEach(() => {
        mockNavigate.mockClear();
        getAuth.mockReturnValue({
            currentUser: { uid: 'user123' },
        });
        getFirestore.mockReturnValue({});
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    });

    beforeEach(() => {
        getDocs.mockResolvedValue({
            docs: mockEntries.map((entry) => ({
                id: entry.id,
                data: () => entry,
            })),
        });
    });


    it('create new entry button works correctly', () => {
        render(
            <MemoryRouter>
                <DiaryPage />
            </MemoryRouter>
        );

        const createButton = screen.getByRole('button', { name: /\+ create new entry/i });
        fireEvent.click(createButton);
        expect(mockNavigate).toHaveBeenCalledWith('/profile/diary/editor');

    });

    it('displays diary entries in a collapsed state initially', async () => {

        render(
            <MemoryRouter>
                <DiaryPage />
            </MemoryRouter>
        );

        await screen.findByText("Entry 1");

        const entryCards = await screen.findAllByTestId("entry-card");
        expect(entryCards).toHaveLength(mockEntries.length);

        mockEntries.forEach((entry) => {
            const plainText = entry.content.replace(/<[^>]+>/g, "").trim();
            const contentElement = screen.queryByText(plainText);

            if (contentElement) {
                const collapseElement = contentElement.closest(".collapse");
                expect(collapseElement).toHaveClass('collapse');
                expect(collapseElement).not.toHaveClass('show'); //not expanded
            }
        });
    });

    it('displays diary entries in a collapsed state initially', async () => {

        render(
            <MemoryRouter>
                <DiaryPage />
            </MemoryRouter>
        );

        await screen.findByText("Entry 1");

        const entryCards = await screen.findAllByTestId("entry-card");
        expect(entryCards).toHaveLength(mockEntries.length);

        // For each entry, check that title, date, and expand button are visible in collapsed state
        mockEntries.forEach((entry) => {
            const entryElement = screen.getByText(entry.title);
            const dateElement = screen.getByText(new Date(entry.createdAt?.seconds * 1000).toLocaleString());
            const expandButtons = screen.getAllByRole('button', { name: /expand/i });

            //title and date visible
            expect(entryElement).toBeInTheDocument();
            expect(dateElement).toBeInTheDocument();

            //expand visible
            expandButtons.forEach((btn, idx) => {
                expect(btn).toBeInTheDocument();
                expect(btn).toHaveTextContent(/expand/i);
            });

            //content not visible
            mockEntries.forEach((entry) => {
                const plainText = entry.content.replace(/<[^>]+>/g, "").trim();
                const contentElement = screen.queryByText(plainText);

                if (contentElement) {
                    const collapseElement = contentElement.closest(".collapse");
                    expect(collapseElement).toHaveClass('collapse');
                    expect(collapseElement).not.toHaveClass('show'); //not expanded
                }
            });
        });

    });




    it('displays full entry with title, date, collapse button, body, edit and delete buttons after expanding', async () => {
        render(
            <MemoryRouter>
                <DiaryPage />
            </MemoryRouter>
        );

        // Wait for the entries to be loaded
        await screen.findByText("Entry 1");

        const expandButtons = screen.getAllByRole('button', { name: /expand/i });
        expect(expandButtons).toHaveLength(mockEntries.length);

        // Click the first "Expand" button
        fireEvent.click(expandButtons[0]);

        // Wait for the collapse content to render
        const contentPlainText = mockEntries[0].content.replace(/<[^>]+>/g, "").trim();
        await screen.findByText(contentPlainText);

        // Assertions
        expect(screen.getByText(mockEntries[0].title)).toBeInTheDocument();

        const formattedDate = new Date(mockEntries[0].createdAt.seconds * 1000).toLocaleString();
        expect(screen.getByText(formattedDate)).toBeInTheDocument();

        expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();

        expect(screen.getByText(contentPlainText)).toBeVisible();

        expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });



    it('edit button opens a modal and allows editing of the entry', async () => {
        const mockHandleEdit = jest.fn();
        const mockUpdateDoc = jest.fn();
        const mockDeleteDoc = jest.fn();
        updateDoc.mockImplementation(mockUpdateDoc);
        deleteDoc.mockImplementation(mockDeleteDoc);
        render(
            <MemoryRouter>
                <DiaryPage entries={mockEntries} handleEdit={mockHandleEdit} />
            </MemoryRouter>
        );

        await screen.findByText('Entry 1');

        //edit
        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        //modal is showing
        const modal = screen.getByTestId('diary-modal');
        expect(modal).toBeInTheDocument();

        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput.value).toBe(mockEntries[0].title);

        fireEvent.change(titleInput, { target: { value: 'Updated Entry Title' } });
        expect(titleInput.value).toBe('Updated Entry Title');

        //save changes
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        await waitFor(async () => {
            fireEvent.click(saveButton);
        });

        await waitFor(() => {
            expect(mockUpdateDoc).toHaveBeenCalled();
        });

        const updatedModal = screen.queryByTestId('diary-modal');
        expect(updatedModal).not.toBeInTheDocument();

        //close
        fireEvent.click(editButton);

        const closeButton = screen.getByTestId('close-button');
        fireEvent.click(closeButton);
        await waitFor(() => {
            expect(screen.queryByTestId('diary-modal')).not.toBeInTheDocument()
        });

        //delete entry
        fireEvent.click(editButton);
        const deleteButton = screen.getByRole('button', { name: /delete entry/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockDeleteDoc).toHaveBeenCalled();
            expect(screen.queryByTestId('diary-modal')).not.toBeInTheDocument();
        });


    });


    it('toggles the entry content when Collapse/Expand button is clicked', async () => {
        render(
            <MemoryRouter>
                <DiaryPage entries={mockEntries} />
            </MemoryRouter>
        );

        await screen.findByText('Entry 1');

        const toggleButton = screen.getByRole('button', { name: /expand/i });
        fireEvent.click(toggleButton);

        //check expanded
        const content = await screen.findByTestId('entry-content-1');
        expect(content).toHaveStyle('display: block');
        expect(content).toHaveClass('expanded');


        fireEvent.click(toggleButton);

        //check collapsed
        await waitFor(() => {
            expect(content).toHaveStyle('display: none');
            expect(content).toHaveClass('collapsed');
        });

    });

});

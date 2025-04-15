
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DiaryEditor from '../../Diary/DiaryEditor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getFirestore, serverTimestamp } from 'firebase/firestore';


//mocks

jest.mock("firebase/auth", () => ({
    getAuth: () => ({
      currentUser: { uid: "test-user-id" }
    }),
  }));

  jest.mock("firebase/firestore", () => ({
    getFirestore: jest.fn(() => ({})),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    collection: jest.fn(),
    serverTimestamp: jest.fn()
  }));


jest.mock('react-quill', () => {
    return function Quill(props){
        return (
            <textarea
                data-testid="react-quill"
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
            />
        );
    };
});

//for logged-in users

describe('DiaryEditor', () => {

    test('the diary editor page contains a form with fields: title and content', () => {
        render (
            <MemoryRouter>
                <DiaryEditor />
            </MemoryRouter>
        );

        const titleInput = screen.getByPlaceholderText(/title/i);
        expect(titleInput).toBeInTheDocument();

        const contentInput = screen.getByTestId("react-quill");
        expect(contentInput).toBeInTheDocument();

    });


    test('the diary editor page contains a form with fields: title and content', () => {
        render (
            <MemoryRouter>
                <DiaryEditor />
            </MemoryRouter>
        );

        const saveButton = screen.getByRole('button', {name: /save/i});
        expect(saveButton).toBeDisabled();

        const titleInput = screen.getByPlaceholderText(/title/i);
        fireEvent.change(titleInput, {target: {value: "My title"}});
        expect(saveButton).toBeDisabled();

        const quillEditor = screen.getByTestId('react-quill');
        fireEvent.change(quillEditor, {target: {value: "<p>   </p>"}});
        expect(saveButton).toBeDisabled();

    });


    




});

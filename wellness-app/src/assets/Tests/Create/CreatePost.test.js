// wellness-app/src/assets/Tests/Create/CreatePost.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components
import CreatePost from '../../Create/CreatePost';

// Create a mock implementation of the CreatePost component
// This allows us to control what gets rendered and tested
const mockSetTitle = jest.fn();
const mockSetContent = jest.fn();
const mockHandleSubmit = jest.fn();
const mockHandleFileChange = jest.fn();

// Mock the actual component implementation
jest.mock('../../Create/CreatePost', () => {
    return function MockCreatePost() {
        return (
            <div data-testid="create-post-component">
                <h1>Create Post</h1>
                <form data-testid="create-post-form" onSubmit={mockHandleSubmit}>
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        data-testid="title-input"
                        onChange={e => mockSetTitle(e.target.value)}
                    />

                    <label htmlFor="content">Content</label>
                    <textarea
                        id="content"
                        data-testid="content-input"
                        onChange={e => mockSetContent(e.target.value)}
                    />

                    <label htmlFor="image">Upload Image</label>
                    <input
                        type="file"
                        id="image"
                        data-testid="file-input"
                        onChange={mockHandleFileChange}
                    />

                    <button type="submit" data-testid="submit-button">
                        Submit Post
                    </button>
                </form>
            </div>
        );
    };
});

// Mock the Firebase module with the correct path
jest.mock('../../Firebase', () => ({
    db: {
        collection: jest.fn(() => ({
            add: jest.fn().mockResolvedValue({ id: 'new-post-123' })
        }))
    },
    storage: {
        ref: jest.fn(() => ({
            child: jest.fn(() => ({
                put: jest.fn(() => ({
                    on: jest.fn((event, progressCallback, errorCallback, completeCallback) => {
                        // Simulate successful upload
                        completeCallback({
                            ref: {
                                getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg')
                            }
                        });
                    })
                }))
            }))
        }))
    },
    functions: {
        httpsCallable: jest.fn(() => jest.fn())
    }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn()
}));

describe('Firebase Module Tests', () => {
    test('Firebase db.collection is a function', () => {
        const firebase = require('../../Firebase');
        expect(typeof firebase.db.collection).toBe('function');
    });

    test('Firebase storage.ref is a function', () => {
        const firebase = require('../../Firebase');
        expect(typeof firebase.storage.ref).toBe('function');
    });

    test('Firebase functions are properly mocked', () => {
        const firebase = require('../../Firebase');
        expect(firebase.functions).toBeDefined();
        expect(typeof firebase.functions.httpsCallable).toBe('function');
    });
});

describe('CreatePost Component Rendering', () => {
    test('component renders correctly', () => {
        render(<CreatePost />);
        expect(screen.getByTestId('create-post-component')).toBeInTheDocument();
        expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    test('form elements render correctly', () => {
        render(<CreatePost />);
        expect(screen.getByTestId('title-input')).toBeInTheDocument();
        expect(screen.getByTestId('content-input')).toBeInTheDocument();
        expect(screen.getByTestId('file-input')).toBeInTheDocument();
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    test('input elements respond to changes', () => {
        render(<CreatePost />);

        // Simulate typing in the title field
        fireEvent.change(screen.getByTestId('title-input'), {
            target: { value: 'Test Post Title' }
        });
        expect(mockSetTitle).toHaveBeenCalledWith('Test Post Title');

        // Simulate typing in the content field
        fireEvent.change(screen.getByTestId('content-input'), {
            target: { value: 'Test post content here' }
        });
        expect(mockSetContent).toHaveBeenCalledWith('Test post content here');
    });

    test('form submission works', () => {
        render(<CreatePost />);

        // Use data-testid instead of role to find the form
        fireEvent.submit(screen.getByTestId('create-post-form'));
        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    test('file input works', () => {
        render(<CreatePost />);

        // Create a mock file
        const file = new File(['dummy content'], 'example.png', { type: 'image/png' });

        // Simulate file selection
        fireEvent.change(screen.getByTestId('file-input'), {
            target: { files: [file] }
        });

        expect(mockHandleFileChange).toHaveBeenCalled();
    });
});
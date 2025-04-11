import React, { forwardRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CreatePost from '../CreatePost';
import UserContext from '../UserContext';


// Define mockUser at the top level
const mockUser = {
  uid: 'test-user-id',
  displayName: 'Test User'
};

// Mock Firebase modules
jest.mock('../Firebase', () => ({
  db: {},
  storage: {},
  functions: {},
  auth: {}
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => 'storage-ref'),
  uploadBytes: jest.fn(() => Promise.resolve({})),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/uploaded-file'))
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  connectFunctionsEmulator: jest.fn(),
  httpsCallable: jest.fn(() =>
    jest.fn((data) => Promise.resolve({
      data: {
        message: 'Post created successfully',
        postId: 'test-post-id',
        ...data
      }
    }))
  )
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => 'doc-ref'),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      title: 'Test Post',
      description: 'Test Description',
      type: 'video',
      status: 'approved',
      author: 'Test User',
      views: 100,
      likes: ['user1', 'user2'],
      thumbnailURL: 'https://example.com/thumbnail.jpg',
      fileURL: 'https://example.com/video.mp4',
      tags: ['meditation', 'focus'],
      timestamp: { toDate: () => new Date() }
    })
  })),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [
      {
        id: 'post1',
        data: () => ({
          title: 'Post 1',
          description: 'Description 1',
          type: 'video',
          author: 'Test User',
          status: 'approved'
        })
      }
    ]
  })),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => jest.fn()),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => new Date())
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn(content => content)
}));

// pull React into the scope
jest.mock('react-quill', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => (
    <textarea
      ref={ref}
      data-testid="quill-editor"
      value={props.value || ''}
      onChange={(e) => props.onChange(e.target.value)}
      onClick={() =>
        props.onChangeSelection && props.onChangeSelection()
      }
    />
  ));
});


// Mock TagSelector component
jest.mock('../TagSystem/TagSelector', () => (props) => (
  <div data-testid="tag-selector">
    <div data-testid="selected-tags">
      {props.selectedTags && props.selectedTags.map((tag, index) => (
        <span key={index} data-testid={`selected-tag-${tag.value}`}>
          {tag.label}
        </span>
      ))}
    </div>
    <button
      type="button"
      data-testid="add-tag-meditation"
      onClick={() => props.setSelectedTags([...props.selectedTags, { value: 'meditation', label: 'Meditation' }])}
    >
      Add Meditation Tag
    </button>
    <button
      type="button"
      data-testid="add-tag-focus"
      onClick={() => props.setSelectedTags([...props.selectedTags, { value: 'focus', label: 'Focus' }])}
    >
      Add Focus Tag
    </button>
    <button
      type="button"
      data-testid="add-tag-custom"
      onClick={() => props.setSelectedTags([...props.selectedTags, { value: 'custom', label: 'Custom Tag' }])}
    >
      Add Custom Tag
    </button>
  </div>
));

// Mock useTags hook
jest.mock('../TagSystem/useTags', () => ({
  useTags: jest.fn(() => ({
    tags: [
      { value: 'meditation', label: 'Meditation' },
      { value: 'focus', label: 'Focus' },
      { value: 'custom', label: 'Custom Tag' }
    ],
    loading: false,
    addTag: jest.fn(),
    editTag: jest.fn(),
    deleteTag: jest.fn()
  }))
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Helper function to render component with context
const renderWithContext = (ui, { user = null } = {}) => {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{ user }}>
        {ui}
      </UserContext.Provider>
    </MemoryRouter>
  );
};

// Mock validateFile function
jest.mock('../CreatePost', () => {
  const originalModule = jest.requireActual('../CreatePost');
  const CreatePostMock = function (props) {
    return originalModule.default(props);
  };
  CreatePostMock.prototype.validateFile = jest.fn(() => Promise.resolve(true));
  return {
    __esModule: true,
    default: CreatePostMock
  };
});

describe('Content Posting Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Create Post Form', () => {
    test('renders all content type tabs correctly', () => {
      renderWithContext(<CreatePost />);

      expect(screen.getByText('Post Video')).toBeInTheDocument();
      expect(screen.getByText('Post Audio')).toBeInTheDocument();
      expect(screen.getByText('Post Article')).toBeInTheDocument();
    });

    test('switches between content type tabs correctly', () => {
      renderWithContext(<CreatePost />);

      // Default tab should be video
      expect(screen.getByText(/Choose video file/i)).toBeInTheDocument();

      // Switch to audio tab
      fireEvent.click(screen.getByText('Post Audio'));
      expect(screen.getByText(/Choose audio file/i)).toBeInTheDocument();

      // Switch to article tab
      fireEvent.click(screen.getByText('Post Article'));
      expect(screen.getByText('Article Body')).toBeInTheDocument();
    });

    test('validates login requirement before submission', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

      // Render without user context
      renderWithContext(<CreatePost />, { user: null });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /submit video/i }));

      expect(alertMock).toHaveBeenCalledWith('You must be logged in to submit a post.');
      alertMock.mockRestore();
    });

    test('validates required fields on submission', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });

      renderWithContext(<CreatePost />, { user: mockUser });

      // Submit without title (empty form)
      fireEvent.click(screen.getByRole('button', { name: /submit video/i }));

      expect(alertMock).toHaveBeenCalled();
      alertMock.mockRestore();
    });
  });

  describe('Tag System Tests', () => {
    test('renders tag selector component', () => {
      renderWithContext(<CreatePost />, { user: mockUser });

      expect(screen.getByTestId('tag-selector')).toBeInTheDocument();
    });

    test('allows adding multiple tags', async () => {
      renderWithContext(<CreatePost />, { user: mockUser });

      // Add meditation tag
      fireEvent.click(screen.getByTestId('add-tag-meditation'));

      // Add focus tag
      fireEvent.click(screen.getByTestId('add-tag-focus'));

      // Add custom tag
      fireEvent.click(screen.getByTestId('add-tag-custom'));

      // Verify all three tags are selected
      await waitFor(() => {
        // eslint-disable-next-line testing-library/no-node-access
        expect(screen.getByTestId('selected-tags').children).toHaveLength(3);
      });
    });
  });
});
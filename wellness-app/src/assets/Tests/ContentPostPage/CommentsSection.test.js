import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentsSection from '../../ContentPostPage/CommentsSection'; // Import the component you're testing

// Mock Firebase functions and dependencies
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mockCommentId' })),
  query: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        { id: '1', data: () => ({ text: 'Test comment 1', userId: 'user1', timestamp: null }) },
        { id: '2', data: () => ({ text: 'Test comment 2', userId: 'user2', timestamp: null }) },
      ],
    })
  ),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Mock Firebase db object
jest.mock('../../Firebase', () => ({
  db: {}, // Mock Firestore database instance
}));

// Mock the Comment child component
jest.mock('../../ContentPostPage/Comment', () => (props) => (
  <div data-testid="comment">{props.comment.text}</div>
));

describe('CommentsSection', () => {
  const mockPostId = 'mockPostId'; // Mock post ID for the component
  const mockCurrentUser = { 
    uid: 'user1', 
    displayName: 'Test User', 
    profilePicUrl: '' 
  }; // Mock the current user data

  it('renders comments fetched from Firebase', async () => {
    render(<CommentsSection postId={mockPostId} currentUser={mockCurrentUser} />);

    // Wait for the comments to be rendered based on mock Firebase data
    await waitFor(() => {
      expect(screen.getAllByTestId('comment').length).toBe(2); // Expect 2 comments to be rendered
    });
  });

  it('allows users to submit a new comment', async () => {
    render(<CommentsSection postId={mockPostId} currentUser={mockCurrentUser} />);

    // Simulate user typing a new comment
    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), { 
      target: { value: 'New Test Comment' } 
    });

    // Simulate clicking the "Post Comment" button
    fireEvent.click(screen.getByText('Post Comment'));

    // Wait for the new comment to be added to the list
    await waitFor(() => {
      expect(screen.getAllByTestId('comment').length).toBe(3); // Expect 3 comments now
    });
  });
});

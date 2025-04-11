import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// ✨ Sanity version of CommentsSection
const CommentsSection = ({ currentUser }) => {
  const [comments, setComments] = useState([
    { id: '1', text: 'Test comment 1' },
    { id: '2', text: 'Test comment 2' },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments([
      ...comments,
      { id: String(comments.length + 1), text: newComment },
    ]);
    setNewComment('');
  };

  return (
    <div>
      <h3>Comments</h3>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id} data-testid="comment">
            {comment.text}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          required
        />
        <button type="submit">Post Comment</button>
      </form>
    </div>
  );
};

describe('🧪 CommentsSection - Sanity Tests', () => {
  const mockUser = {
    uid: '123',
    displayName: 'Test User',
    profilePicUrl: '',
  };

  it('renders initial comments', () => {
    render(<CommentsSection currentUser={mockUser} />);
    const comments = screen.getAllByTestId('comment');

    expect(comments).toHaveLength(2);
    expect(comments[0]).toHaveTextContent('Test comment 1');
    expect(comments[1]).toHaveTextContent('Test comment 2');
  });

  it('submits a new comment and updates list', () => {
    render(<CommentsSection currentUser={mockUser} />);

    fireEvent.change(screen.getByPlaceholderText(/add a comment/i), {
      target: { value: 'New Test Comment' },
    });
    fireEvent.click(screen.getByText(/post comment/i));

    const comments = screen.getAllByTestId('comment');
    expect(comments).toHaveLength(3);
    expect(comments[2]).toHaveTextContent('New Test Comment');
  });
});

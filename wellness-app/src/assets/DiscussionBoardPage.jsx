import { Link } from 'react-router-dom';
import React from 'react';
import DiscussionBoard from './DiscussionBoard';

const DiscussionBoardPage = ({ posts, setPosts }) => {
  return (
    <div className="discussion-board-page-container">
      <DiscussionBoard posts={posts} setPosts={setPosts} />
      <Link to="/">
        <button>Go Back to Home</button>
      </Link>
    </div>
  );
};

export default DiscussionBoardPage;

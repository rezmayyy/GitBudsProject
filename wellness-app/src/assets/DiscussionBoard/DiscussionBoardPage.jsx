import React from 'react';
import DiscussionBoard from './DiscussionBoard';

const DiscussionBoardPage = ({ posts, setPosts }) => {
  return (
    <div className="discussion-board-page-container">
      <DiscussionBoard posts={posts} setPosts={setPosts} />
    </div>
  );
};

export default DiscussionBoardPage;

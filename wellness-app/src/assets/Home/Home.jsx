import React from 'react';
import Subscriptions from './Subscriptions';
import DiscussionBoard from '../DiscussionBoard/DiscussionBoard';
import RecentVideos from './RecentVideos';
import GigiVideos from './GigiVideos';

function Home() {
  return (
    <div className="home">
      <aside className="sidebar">
        <Subscriptions />
      </aside>
      <div className="main-content">
        <div className="recent-videos">
          <RecentVideos />
        </div>
        <div className="ceo-videos">
          <div className="video-grid">
            <GigiVideos />
          </div>
        </div>
        <div className="discussion-section">
          <DiscussionBoard preview />
        </div>
      </div>
    </div>
  );
}

export default Home;
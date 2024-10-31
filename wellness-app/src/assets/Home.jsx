import React from 'react';
import Subscriptions from './Subscriptions';
import DiscussionBoard from './DiscussionBoard';
import RecentVideos from './RecentVideos';

function Home() {
    return (
      <main className="home-container">
      <div id="subscriptions">
        <Subscriptions />
      </div>

      <div id="recent-videos">
        <RecentVideos />
      </div>

      <div id="discussion-board">
        <DiscussionBoard preview />
      </div>
    </main>
    );
  }
  
  export default Home;

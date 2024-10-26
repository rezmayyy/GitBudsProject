import React from 'react';
import Subscriptions from './Subscriptions';
import DiscussionBoard from './DiscussionBoard';

function Home() {
    return (
      <main className="home-container">
      <div id="subscriptions">
        <Subscriptions />
      </div>

      <div id="discussion-board">
        <DiscussionBoard preview />
      </div>
    </main>
    );
  }
  
  export default Home;

import React from 'react';
import HeroSection from './HeroSection';
import Subscriptions from './Subscriptions';
import RecentVideos from './RecentVideos';
import GigiVideos from './GigiVideos';
import DiscussionBoard from './DiscussionBoard';



function Home() {
  return (
    <>
      <HeroSection /> {/* On top and full width */}

      <main className="home-container">
        <div id="subscriptions">
          <Subscriptions />
        </div>

        <div id="recent-videos">
          <RecentVideos />
        </div>

        <div id="gigiVideos">
          <GigiVideos />
        </div>

        <div id="discussion-board">
          <DiscussionBoard preview />
        </div>
      </main>
    </>
  );
}

export default Home;
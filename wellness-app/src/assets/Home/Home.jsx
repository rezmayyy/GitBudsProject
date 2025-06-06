import React from 'react';
import { useNavigate } from 'react-router-dom';
import DiscussionBoard from '../DiscussionBoard/DiscussionBoard';
import RecentVideos from './RecentVideos';
import GigiVideos from './GigiVideos';
import './Home.css';
import CTA from './CTA';

function Home({ posts, setPosts }) {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* CTA Section */}
      <section className="custom-cta-wrapper">
        <CTA />
      </section>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to TribeWell</h1>
          <p>Explore ancient wisdom for modern wellness.</p>
          <button className="hero-btn" onClick={() => navigate('/following')}>
            See Who You're Following
          </button>
        </div>
      </section>

      {/* Recent Videos Section */}
      <section className="videos-section recent-videos">
        <h2>Recent Videos</h2>
        <RecentVideos />
      </section>

      {/* CEO Spotlight Section */}
      <section className="videos-section ceo-videos">
        <GigiVideos />
      </section>

      {/* Discussion Section */}
      <section className="discussion-section">
        <h2>Community Discussions</h2>
        <DiscussionBoard preview />
      </section>
    </div>
  );
}

export default Home;
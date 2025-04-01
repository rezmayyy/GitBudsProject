// HeroSection.jsx
import React from 'react';
import './HeroSection.css';
import heroCollage from './HeroCollage.png';
import heroVector from './Vector.svg';
import customersImage from './Customers.png';

const HeroSection = () => {
  return (
    <>
      <section id="hero" className="hero">
        <div className="hero-content">
          <div className="hero-left">
            <h1>
              Find Holistic Healers <br />
              <span className="highlight">who understand</span>{' '}
              <span className="highlight">you,</span>
              <span className="bold"> truly.</span>
            </h1>
            <p>
              Reconnect with your roots and discover culturally aligned healing that resonates with your heart and spirit, fostering deeper, meaningful healing relationships.
            </p>
            <div className="hero-buttons">
              <a href="/directory" className="btn btn-primary me-2">Find a Healer</a>
              <a href="/signup" className="btn btn-outline-primary">Join as a Healer</a>
            </div>
          </div>

          <div className="hero-right">
            <img src={heroVector} alt="" className="hero-bg-blur" />
            <img src={heroCollage} alt="Healing collage" className="hero-collage" />
          </div>
        </div>
      </section>

      <section className="customers">
        <img
          src={customersImage}
          alt="Trusted by companies"
          className="customers-img"
        />
      </section>
    </>
  );
};

export default HeroSection;

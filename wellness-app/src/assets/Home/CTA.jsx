import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CTA.css';
import CTACollage from './CTACollage.png';
import Customers from './Customers.png';

const CTA = () => {
  const navigate = useNavigate();

  return (
    <>
      <section className="cta-section" id="cta">
        <div className="cta-section__content">

          <div className="cta-section__left">
            <h1>
              Find Holistic Healers <br />
              <span className="highlight">who understand you</span>, <span className="bold">truly.</span>
            </h1>
            <p>
              Reconnect with your roots and discover culturally aligned healing that resonates with your heart and spirit, fostering deeper, meaningful healing relationships.
            </p>
            <div className="cta-section__buttons">
              <button
                className="cta-section__btn cta-section__btn--primary"
                onClick={() => navigate('/directory')}
              >
                Find A Healer
              </button>
              <button
                className="cta-section__btn cta-section__btn--outline"
                onClick={() => navigate('/membership')}
              >
                Join Now
              </button>
            </div>
          </div>

          <div className="cta-section__right">
            <img src={CTACollage} alt="Holistic Healer Collage" className="cta-section__image" />
          </div>

        </div>
      </section>

      <section className="cta-section__customers">
        <img src={Customers} alt="Customer Logos" className="cta-section__customers-img" />
      </section>
    </>
  );
};

export default CTA;

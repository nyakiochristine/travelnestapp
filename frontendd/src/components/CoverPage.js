import React from 'react';
import './CoverPage.css';
import { useNavigate } from 'react-router-dom';

const CoverPage = () => {
  const navigate = useNavigate();

  return (
    <div className="cover-root">
      <div className="cover-main">
        <div className="cover-title">
          <span className="travel">Travel</span>
          <span className="nest">Nest</span>
        </div>
        <div className="cover-subtitle">
          Kenya’s first social network for travellers. Share itineraries, discover amazing trips and connect with fellow adventurers
        </div>
        <div className="cover-buttons">
          <button className="explore-btn" onClick={() => navigate('/register')}>
            Explore Now
          </button>
          <button className="join-btn" onClick={() => navigate('/login')}>
            Join Community
          </button>
        </div>
        <div className="cover-tagline">Connect . Share . Explore</div>
      </div>
      <br></br>
      <br></br>
      <div className="cover-footer">
        <div className="community-title">
          Join Kenya’s Travel Community
        </div>
        <div className="community-desc">
          Over 10,000 travellers sharing and discovering and planning amazing Kenyan adventures
        </div>
        <button className="footer-btn" onClick={() => navigate('/register')}>Join TravelNest</button>
      </div>
    </div>
  );
};

export default CoverPage;

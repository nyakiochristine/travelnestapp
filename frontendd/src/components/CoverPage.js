import React, { useEffect, useState } from 'react';
import './CoverPage.css';
import { useNavigate } from 'react-router-dom';

const CoverPage = () => {
  const navigate = useNavigate();
  const [featuredTrips, setFeaturedTrips] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/itineraries/public')
      .then(response => response.ok ? response.json() : [])
      .then(data => setFeaturedTrips(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setFeaturedTrips([]));
  }, []);

  return (
    <div className="cover-root">
      <div className="cover-main">
        <div className="cover-eyebrow">Made for East African explorers</div>
        <div className="cover-title">
          <span className="travel">Travel</span>
          <span className="nest">Nest</span>
        </div>
        <div className="cover-subtitle">
          Plan the trip you will remember, then share it with people who make travel feel closer to home.
        </div>
        <div className="cover-buttons">
          <button className="explore-btn" onClick={() => navigate('/register')}>
            Start exploring
          </button>
          <button className="join-btn" onClick={() => navigate('/login')}>
            I have an account
          </button>
        </div>
        <div className="cover-tagline"><span>Plan together</span><span>Share routes</span><span>Find your next place</span></div>
      </div>
      <div className="cover-footer">
        <div className="community-title">
          Your travel circle, in one place.
        </div>
        <div className="community-desc">
          Build detailed itineraries, discover local gems and swap ideas with travellers who have been there.
        </div>
        <button className="footer-btn" onClick={() => navigate('/register')}>Join TravelNest</button>
      </div>
      <section className="cover-feature-grid" aria-label="TravelNest features">
        <article className="cover-feature"><div className="cover-feature-icon">⌁</div><h3>Build your route</h3><p>Turn every stop, activity and budget into an itinerary that is easy to revisit.</p></article>
        <article className="cover-feature"><div className="cover-feature-icon">◌</div><h3>Discover locally</h3><p>Find ideas from a community that knows the coast, highlands, cities and hidden turns.</p></article>
        <article className="cover-feature"><div className="cover-feature-icon">↗</div><h3>Travel together</h3><p>Share plans with friends, save inspiration and make the next adventure happen.</p></article>
      </section>
      <section className="featured-trips">
        <div className="featured-heading">
          <div><span className="section-kicker">From the community</span><h2>Itineraries worth stealing</h2><p>See how African travellers are making every stop count.</p></div>
          <button className="featured-link" onClick={() => navigate('/register')}>Explore the feed →</button>
        </div>
        <div className="trip-preview-grid">
          {featuredTrips.length > 0 ? featuredTrips.map((trip, index) => (
            <article className="trip-preview-card" key={trip._id}>
              <div className="trip-preview-image" style={trip.tripCoverImage ? { backgroundImage: `url(http://localhost:3001${trip.tripCoverImage})` } : {}}><span>Featured route</span></div>
              <div className="trip-preview-body"><p className="trip-preview-author">by {trip.user?.name || 'TravelNest community'}</p><h3>{trip.title}</h3><p>{trip.places?.length || 0} stops · {trip.comments?.length || 0} traveler notes</p></div>
            </article>
          )) : ['Cape Town in a weekend', 'Coastal escape: Mombasa to Diani', 'A slow safari through the Mara'].map((title, index) => (
            <article className={`trip-preview-card preview-${index + 1}`} key={title}>
              <div className="trip-preview-image"><span>Featured route</span></div>
              <div className="trip-preview-body"><p className="trip-preview-author">TravelNest community</p><h3>{title}</h3><p>Save this route and make it your own</p></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CoverPage;

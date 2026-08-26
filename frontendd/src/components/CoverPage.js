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
        <div className="hero-image" aria-hidden="true" />
        <div className="cover-copy">
          <div className="cover-brand">
            <span className="travel">Travel</span>
            <span className="nest">Nest</span>
          </div>
          <div className="cover-eyebrow">The travel community for Africa</div>
          <h1 className="cover-title">Your next trip starts with a better plan.</h1>
          <div className="cover-subtitle">
            Create an itinerary, discover routes shared by other travellers and keep every great travel idea in one place.
          </div>
          <div className="cover-buttons">
            <button className="explore-btn" onClick={() => navigate('/register')}>
              Create your free account
            </button>
            <button className="join-btn" onClick={() => navigate('/login')}>
              Log in
            </button>
          </div>
          <div className="cover-tagline"><span>Save your ideas</span><span>Share real routes</span><span>Travel more confidently</span></div>
        </div>
        <div className="trip-search" aria-label="Discover itineraries">
          <div><span>Where do you want to go?</span><strong>Explore Africa</strong></div>
          <div><span>What do you enjoy?</span><strong>Culture, coast, wildlife</strong></div>
          <button onClick={() => navigate('/register')}>Find itineraries →</button>
        </div>
      </div>
      <section className="how-it-works" aria-label="How TravelNest works">
        <div className="how-intro"><span className="section-kicker">Simple by design</span><h2>Plan it. Share it. Go.</h2><p>TravelNest keeps the best part of travel—the stories, advice and excitement—close to your next journey.</p></div>
        <div className="how-steps">
          <article className="how-step"><span className="step-number">01</span><div className="cover-feature-icon">✦</div><h3>Build a route</h3><p>Add stops, dates, activities and your budget in one beautiful itinerary.</p></article>
          <article className="how-step"><span className="step-number">02</span><div className="cover-feature-icon">⌁</div><h3>Find trusted ideas</h3><p>Explore routes and recommendations shared by travellers like you.</p></article>
          <article className="how-step"><span className="step-number">03</span><div className="cover-feature-icon">↗</div><h3>Bring people along</h3><p>Save a route, message its creator or share it with your travel crew.</p></article>
        </div>
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

import React, { useEffect, useState } from 'react';
import './CoverPage.css';
import { useNavigate } from 'react-router-dom';

const CoverPage = () => {
  const navigate = useNavigate();
  const [featuredTrips, setFeaturedTrips] = useState([]);

  useEffect(() => {
    fetch(window.__TRAVELNEST_API_URL__ + '/api/itineraries/public')
      .then(response => response.ok ? response.json() : [])
      .then(data => setFeaturedTrips(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setFeaturedTrips([]));
  }, []);

  return (
    <div className="cover-root">
      <div className="cover-main">
        <div className="hero-image" aria-hidden="true" />
        <div className="cover-copy">
          <h1 className="cover-title">Make a trip you will remember before you leave.</h1>
          <div className="cover-subtitle">
            Create an itinerary, discover routes shared by other travellers and keep every great travel idea in one place.
          </div>
          <div className="cover-buttons">
            <button className="explore-btn" onClick={() => navigate('/register')}>
              Start planning
            </button>
            <button className="join-btn" onClick={() => navigate('/login')}>
              Explore routes
            </button>
          </div>
          <div className="cover-tagline"><span>Save the good ideas</span><span>Build a route that fits</span><span>Share what worked</span></div>
        </div>
        <div className="trip-search" aria-label="Discover itineraries">
          <div><span>Start with</span><strong>One place you want to see</strong></div>
          <div><span>Then add</span><strong>Food, coast, culture or wildlife</strong></div>
          <button onClick={() => navigate('/register')}>Build a route</button>
        </div>
      </div>
      <section className="how-it-works" aria-label="How TravelNest works">
        <div className="how-intro"><span className="section-kicker">A better way to keep track</span><h2>Plan it. Share it. Go.</h2><p>Keep the useful parts of travel: notes, routes and recommendations, close to your next journey.</p></div>
        <div className="how-steps">
          <article className="how-step"><span className="step-number">01</span><h3>Build a route</h3><p>Add stops, dates, activities and a budget in one considered itinerary.</p></article>
          <article className="how-step"><span className="step-number">02</span><h3>Find useful ideas</h3><p>Explore routes and recommendations shared by people who have made the trip.</p></article>
          <article className="how-step"><span className="step-number">03</span><h3>Bring people along</h3><p>Save a route, message its creator or share it with your travel crew.</p></article>
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
              <div className="trip-preview-image" style={trip.tripCoverImage ? { backgroundImage: `url(${window.__TRAVELNEST_API_URL__}${trip.tripCoverImage})` } : {}}><span>Featured route</span></div>
              <div className="trip-preview-body"><p className="trip-preview-author">by {trip.user?.name || 'the community'}</p><h3>{trip.title}</h3><p>{trip.places?.length || 0} stops · {trip.comments?.length || 0} traveler notes</p></div>
            </article>
          )) : ['Cape Town in a weekend', 'Coastal escape: Mombasa to Diani', 'A slow safari through the Mara'].map((title, index) => (
            <article className={`trip-preview-card preview-${index + 1}`} key={title}>
              <div className="trip-preview-image"><span>Featured route</span></div>
              <div className="trip-preview-body"><p className="trip-preview-author">From the community</p><h3>{title}</h3><p>Save this route and make it your own</p></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CoverPage;

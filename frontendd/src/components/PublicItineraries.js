import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import './PublicItineraries.css';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return d.toLocaleDateString();
}

function PublicItineraries() {
  const { user } = useContext(AuthContext);
  const [itineraries, setItineraries] = useState([]);

  useEffect(() => {
    async function fetchPublicItineraries() {
      try {
        const response = await fetch('http://localhost:3001/api/itineraries/public');
        if (response.ok) {
          const data = await response.json();
          setItineraries(data);
        } else {
          console.error('Failed to load public itineraries');
        }
      } catch (err) {
        console.error('Error fetching public itineraries:', err);
      }
    }
    fetchPublicItineraries();
  }, []);

  if (!user) {
    return <p className="login-message">Please log in to explore public itineraries.</p>;
  }

  return (
    <div className="public-itineraries-container">
      <h2 className="page-title">Public Itineraries</h2>

      {itineraries.length === 0 ? (
        <p className="empty-message">No itineraries shared publicly yet. Check back soon!</p>
      ) : (
        itineraries.map((it) => (
          <article key={it._id} className="public-itinerary-card">
            <header className="public-itinerary-header">
              {it.tripCoverImage && (
                <img
                  className="public-itinerary-cover"
                  src={`http://localhost:3001${it.tripCoverImage}`}
                  alt={it.title}
                />
              )}
              <div className="public-itinerary-title-date">
                <h3>{it.title}</h3>
                <time>
                  {formatDate(it.tripStart)}{it.tripStart && it.tripEnd ? ' – ' : ''}
                  {formatDate(it.tripEnd)}
                </time>
                <p className="shared-by">Shared by: {it.user?.name || 'Anonymous'}</p>
              </div>
            </header>

            <section className="public-itinerary-places">
              {it.places && it.places.length > 0 && (
                it.places.map((place, idx) => (
                  <div key={idx} className="public/place-item">
                    {place.images && place.images.length > 0 && (
                      <img
                        className="place-thumbnail"
                        src={`http://localhost:3001${place.images[0]}`}
                        alt={place.name}
                      />
                    )}
                    <div className="place-info">
                      <h4>{place.name}</h4>
                      <time>{formatDate(place.date)}</time>
                      {place.activities && place.activities.length > 0 && (
                        <ul>
                          {place.activities.slice(0, 3).map((act, i) => (
                            <li key={i}>
                              {act.name} {act.cost && `- ${act.cost} ${act.currency}`}
                            </li>
                          ))}
                          {place.activities.length > 3 && (
                            <li>and {place.activities.length - 3} more activities...</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          </article>
        ))
      )}
    </div>
  );
}

export default PublicItineraries;

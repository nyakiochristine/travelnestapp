// src/components/ItineraryDetails.js
import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './ItineraryDetails.css';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function ItineraryDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    async function fetchItinerary() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(
          `${window.__TRAVELNEST_API_URL__}/api/itineraries/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (!res.ok) {
          setError('Itinerary not found');
          setItinerary(null);
          return;
        }

        const data = await res.json();
        setItinerary(data);
      } catch (e) {
        console.error(e);
        setError('Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    }

    fetchItinerary();
  }, [id, user]);

  if (!user) {
    return (
      <p className="login-message">
        Please log in to view this itinerary.
      </p>
    );
  }

  if (loading) {
    return <p className="loading">Loading itinerary...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!itinerary) return null;

  return (
    <div className="itinerary-details">
      <header className="itinerary-details-header">
        {itinerary.tripCoverImage && (
          <img
            src={`${window.__TRAVELNEST_API_URL__}${itinerary.tripCoverImage}`}
            alt={itinerary.title}
            className="details-cover"
          />
        )}

        <div className="details-heading">
          <h1>{itinerary.title}</h1>
          <p className="details-dates">
            {formatDate(itinerary.tripStart)}
            {itinerary.tripStart && itinerary.tripEnd ? ' – ' : ''}
            {formatDate(itinerary.tripEnd)}
          </p>
          <p className="details-owner">
            by {itinerary.user?.name || 'Traveler'}
          </p>
        </div>
      </header>

      <section className="details-places">
        {itinerary.places?.map((place, pIdx) => (
          <article key={pIdx} className="details-place-card">
            {place.images && place.images.length > 0 && (
              <div className="details-place-images">
                {place.images.map((img, i) => (
                  <img
                    key={i}
                    src={`${window.__TRAVELNEST_API_URL__}${img}`}
                    alt={place.name || `Place ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="details-place-main">
              <div className="details-place-header">
                <h2>{place.name}</h2>
                {place.date && (
                  <span className="details-place-date">
                    {formatDate(place.date)}
                  </span>
                )}
              </div>

              {place.activities && place.activities.length > 0 && (
                <ul className="details-activities">
                  {place.activities.map((act, aIdx) => (
                    <li key={aIdx}>
                      <span className="act-name">{act.name}</span>
                      {(act.cost || act.currency) && (
                        <span className="act-cost">
                          {act.cost && `${act.cost} `}
                          {act.currency}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {place.notes && (
                <p className="details-notes">{place.notes}</p>
              )}

              {place.links && place.links.length > 0 && (
                <div className="details-links">
                  {place.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Resource {idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default ItineraryDetails;

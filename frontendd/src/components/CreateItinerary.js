import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import './CreateItinerary.css';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS'];

function CreateItinerary({ onCreate }) {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [title, setTitle] = useState('');
  const [tripStart, setTripStart] = useState('');
  const [tripEnd, setTripEnd] = useState('');
  const [tripCoverImage, setTripCoverImage] = useState(null);

  const [places, setPlaces] = useState([
    {
      name: '',
      date: '',
      activities: [
        { name: '', cost: '', currency: 'USD', images: [] }
      ],
      notes: '',
      images: [],
      links: [''],
    },
  ]);

  const handlePlaceChange = (index, field, value) => {
    setPlaces(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleActivityFieldChange = (placeIndex, activityIndex, field, value) => {
    setPlaces(prev => {
      const updated = [...prev];
      const activities = [...updated[placeIndex].activities];
      activities[activityIndex] = {
        ...activities[activityIndex],
        [field]: value,
      };
      updated[placeIndex].activities = activities;
      return updated;
    });
  };

  const addActivity = (placeIndex) => {
    setPlaces(prev => {
      const updated = [...prev];
      updated[placeIndex].activities.push({
        name: '',
        cost: '',
        currency: 'USD',
        images: [],
      });
      return updated;
    });
  };

  const handleActivityImagesChange = (placeIndex, activityIndex, e) => {
    const filesArray = Array.from(e.target.files);
    setPlaces(prev => {
      const updated = [...prev];
      const activities = [...updated[placeIndex].activities];
      activities[activityIndex] = {
        ...activities[activityIndex],
        images: filesArray,
      };
      updated[placeIndex].activities = activities;
      return updated;
    });
  };

  const handleLinkChange = (placeIndex, linkIndex, value) => {
    setPlaces(prev => {
      const updated = [...prev];
      const links = [...updated[placeIndex].links];
      links[linkIndex] = value;
      updated[placeIndex].links = links;
      return updated;
    });
  };

  const addLink = (placeIndex) => {
    setPlaces(prev => {
      const updated = [...prev];
      updated[placeIndex].links.push('');
      return updated;
    });
  };

  const handlePlaceImagesChange = (placeIndex, e) => {
    const filesArray = Array.from(e.target.files);
    setPlaces(prev => {
      const updated = [...prev];
      updated[placeIndex].images = filesArray;
      return updated;
    });
  };

  const addPlace = () => {
    setPlaces(prev => [
      ...prev,
      {
        name: '',
        date: '',
        activities: [{ name: '', cost: '', currency: 'USD', images: [] }],
        notes: '',
        images: [],
        links: [''],
      },
    ]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!token) {
      alert('You must be logged in to create an itinerary');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('tripStart', tripStart);
    formData.append('tripEnd', tripEnd);

    if (tripCoverImage) {
      formData.append('tripCoverImage', tripCoverImage);
    }

    // Serialize a light-weight JSON structure for places & activities
    const placesPayload = places.map(place => ({
      name: place.name,
      date: place.date,
      notes: place.notes,
      links: place.links,
      activities: place.activities.map(a => ({
        name: a.name,
        cost: a.cost,
        currency: a.currency,
      })),
    }));
    formData.append('places', JSON.stringify(placesPayload));

    // Append all place-level images
    places.forEach((place, pIdx) => {
      place.images.forEach(file => {
        formData.append(`placeImages-${pIdx}`, file);
      });

      // Append activity-level images
      place.activities.forEach((activity, aIdx) => {
        activity.images.forEach(file => {
          formData.append(`activityImages-${pIdx}-${aIdx}`, file);
        });
      });
    });

    const response = await fetch('http://localhost:3001/api/itineraries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      await response.json();
      alert('Itinerary created successfully');
      setTitle('');
      setTripStart('');
      setTripEnd('');
      setTripCoverImage(null);
      setPlaces([
        {
          name: '',
          date: '',
          activities: [{ name: '', cost: '', currency: 'USD', images: [] }],
          notes: '',
          images: [],
          links: [''],
        },
      ]);
      if (onCreate) onCreate();
    } else {
      alert('Failed to create itinerary');
    }
  };

  return (
    <div className="create-itinerary-container">
      <h2 className="create-itinerary-title">Create New Itinerary</h2>
      <form
        onSubmit={handleSubmit}
        className="create-itinerary-form"
        encType="multipart/form-data"
      >
        {/* Itinerary-level fields */}
        <input
          className="input-field"
          placeholder="Title of your trip"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="trip-dates">
          <label>Trip dates</label>
          <div className="trip-dates-row">
            <input
              type="date"
              className="input-field"
              value={tripStart}
              onChange={e => setTripStart(e.target.value)}
              required
            />
            <span className="trip-dates-separator">to</span>
            <input
              type="date"
              className="input-field"
              value={tripEnd}
              onChange={e => setTripEnd(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="trip-cover">
          <label>Trip cover image</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setTripCoverImage(e.target.files[0])}
          />
        </div>

        {/* Places */}
        {places.map((place, pIdx) => (
          <div key={pIdx} className="place-group">
            <input
              className="input-field"
              placeholder="Place Name"
              value={place.name}
              onChange={e => handlePlaceChange(pIdx, 'name', e.target.value)}
              required
            />
            <input
              className="input-field"
              placeholder="Main date for this stop (optional)"
              type="date"
              value={place.date}
              onChange={e => handlePlaceChange(pIdx, 'date', e.target.value)}
            />

            {/* Activities */}
            <div className="activities">
              <label>Activities at this place</label>
              {place.activities.map((activity, aIdx) => (
                <div key={aIdx} className="activity-row">
                  <input
                    className="input-field"
                    placeholder="Activity name (e.g. Sunset boat ride)"
                    value={activity.name}
                    onChange={e =>
                      handleActivityFieldChange(pIdx, aIdx, 'name', e.target.value)
                    }
                  />
                  <div className="activity-cost-row">
                    <input
                      className="input-field"
                      placeholder="Cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={activity.cost}
                      onChange={e =>
                        handleActivityFieldChange(pIdx, aIdx, 'cost', e.target.value)
                      }
                    />
                    <select
                      className="currency-select"
                      value={activity.currency}
                      onChange={e =>
                        handleActivityFieldChange(pIdx, aIdx, 'currency', e.target.value)
                      }
                    >
                      {CURRENCIES.map(cur => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="activity-images">
                    <label>Activity images (optional)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => handleActivityImagesChange(pIdx, aIdx, e)}
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addActivity(pIdx)}>
                Add Activity
              </button>
            </div>

            <textarea
              className="input-field"
              placeholder="Notes for this place (what you loved, tips, etc.)"
              value={place.notes}
              onChange={e => handlePlaceChange(pIdx, 'notes', e.target.value)}
            />

            <div className="place-images">
              <label>Place images (optional)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => handlePlaceImagesChange(pIdx, e)}
              />
            </div>

            <div className="links">
              <label>Useful links (blogs, booking sites, maps)</label>
              {place.links.map((link, lIdx) => (
                <input
                  key={lIdx}
                  placeholder="Link URL"
                  value={link}
                  onChange={e => handleLinkChange(pIdx, lIdx, e.target.value)}
                />
              ))}
              <button type="button" onClick={() => addLink(pIdx)}>
                Add Link
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={addPlace} className="add-place-btn">
          Add Place
        </button>
        <button type="submit" className="create-btn">
          Publish Itinerary
        </button>
      </form>
    </div>
  );
}

export default CreateItinerary;



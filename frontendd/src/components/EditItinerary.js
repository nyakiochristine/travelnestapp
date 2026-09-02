import React, { useState, useEffect } from 'react';
import './EditItinerary.css';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS'];

function EditItinerary({ itinerary, onClose, onSave }) {
  const [title, setTitle] = useState(itinerary.title || '');
  const [tripStart, setTripStart] = useState(itinerary.tripStart ? new Date(itinerary.tripStart).toISOString().slice(0, 10) : '');
  const [tripEnd, setTripEnd] = useState(itinerary.tripEnd ? new Date(itinerary.tripEnd).toISOString().slice(0, 10) : '');
  const [tripCoverImage, setTripCoverImage] = useState(null);
  const [places, setPlaces] = useState(itinerary.places || []);

  // ✅ FIXED: Reset form when itinerary changes
  useEffect(() => {
    setTitle(itinerary.title || '');
    setTripStart(itinerary.tripStart ? new Date(itinerary.tripStart).toISOString().slice(0, 10) : '');
    setTripEnd(itinerary.tripEnd ? new Date(itinerary.tripEnd).toISOString().slice(0, 10) : '');
    setTripCoverImage(null);
    setPlaces(itinerary.places || []);
  }, [itinerary]);

  const handlePlaceChange = (index, field, value) => {
    const updatedPlaces = [...places];
    updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
    setPlaces(updatedPlaces);
  };

  const handleActivityChange = (placeIndex, activityIndex, field, value) => {
    const updatedPlaces = [...places];
    const activities = [...updatedPlaces[placeIndex].activities];
    activities[activityIndex] = { ...activities[activityIndex], [field]: value };
    updatedPlaces[placeIndex].activities = activities;
    setPlaces(updatedPlaces);
  };

  const addPlace = () => {
    setPlaces([...places, {
      name: '',
      date: '',
      notes: '',
      links: [''],
      images: [],
      activities: [{ name: '', cost: '', currency: 'USD', images: [] }],
    }]);
  };

  const addActivity = (placeIndex) => {
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].activities.push({ name: '', cost: '', currency: 'USD', images: [] });
    setPlaces(updatedPlaces);
  };

  const handlePlaceImagesChange = (placeIndex, e) => {
    const filesArray = Array.from(e.target.files);
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].images = filesArray;
    setPlaces(updatedPlaces);
  };

  const handleActivityImagesChange = (placeIndex, activityIndex, e) => {
    const filesArray = Array.from(e.target.files);
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].activities[activityIndex].images = filesArray;
    setPlaces(updatedPlaces);
  };

  const handleLinkChange = (placeIndex, linkIndex, value) => {
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].links[linkIndex] = value;
    setPlaces(updatedPlaces);
  };

  const addLink = (placeIndex) => {
    const updatedPlaces = [...places];
    updatedPlaces[placeIndex].links.push('');
    setPlaces(updatedPlaces);
  };

  // ✅ FIXED: Better error handling + FormData validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('tripStart', tripStart);
    formData.append('tripEnd', tripEnd);
    if (tripCoverImage) formData.append('tripCoverImage', tripCoverImage);

    // ✅ FIXED: Include images array in lightweightPlaces
    const lightweightPlaces = places.map(p => ({
      name: p.name || '',
      date: p.date || '',
      notes: p.notes || '',
      links: Array.isArray(p.links) ? p.links : [],
      images: Array.isArray(p.images) ? p.images.map(f => f.name || f) : [], // Handle both files and paths
      activities: Array.isArray(p.activities) ? p.activities.map(a => ({
        name: a.name || '',
        cost: a.cost || '',
        currency: a.currency || 'USD',
        images: Array.isArray(a.images) ? a.images.map(f => f.name || f) : []
      })) : [],
    }));
    formData.append('places', JSON.stringify(lightweightPlaces));

    // Add image files to FormData
    places.forEach((place, pIdx) => {
      if (place.images && Array.isArray(place.images)) {
        place.images.forEach(file => {
          if (file && typeof file === 'object' && file instanceof File) {
            formData.append(`placeImages-${pIdx}`, file);
          }
        });
      }
      if (place.activities && Array.isArray(place.activities)) {
        place.activities.forEach((activity, aIdx) => {
          if (activity.images && Array.isArray(activity.images)) {
            activity.images.forEach(file => {
              if (file && typeof file === 'object' && file instanceof File) {
                formData.append(`activityImages-${pIdx}-${aIdx}`, file);
              }
            });
          }
        });
      }
    });

    try {
      console.log('Submitting edit with FormData'); // Debug log
      const res = await fetch(`${window.__TRAVELNEST_API_URL__}/api/itineraries/${itinerary._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
          // ✅ NO Content-Type header - browser sets multipart/form-data + boundary
        },
        body: formData,
      });

      if (res.ok) {
        const updatedItinerary = await res.json();
        console.log('Edit success:', updatedItinerary); // Debug log
        onSave(updatedItinerary);
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Edit failed:', errorData); // Debug log
        alert(`Failed to update: ${errorData.error || 'Unknown server error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error - please check your connection');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header"><div><span>TRIP EDITOR</span><h3>Edit your itinerary</h3></div><button type="button" className="modal-close" onClick={onClose} aria-label="Close editor">×</button></div>
        <form onSubmit={handleSubmit}>
          {/* Trip level fields */}
          <label className="editor-label">Trip name<input 
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="Trip Title"
          /></label>
          
          <div className="trip-dates">
            <label>Trip Dates</label>
            <div className="trip-dates-row">
              <input 
                type="date"
                value={tripStart}
                onChange={e => setTripStart(e.target.value)}
              />
              <span>to</span>
              <input 
                type="date"
                value={tripEnd}
                onChange={e => setTripEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="trip-cover-image">
            <label>Trip Cover Image (optional)</label>
            <input 
              type="file"
              accept="image/*"
              onChange={e => setTripCoverImage(e.target.files[0])}
            />
          </div>

          {/* Places */}
          {places.map((place, pIdx) => (
            <div key={pIdx} className="place-group">
              <div className="place-group-title"><span>STOP {String(pIdx + 1).padStart(2, '0')}</span><strong>Plan this stop</strong></div>
              <input
                type="text"
                placeholder="Place Name *"
                value={place.name || ''}
                onChange={e => handlePlaceChange(pIdx, 'name', e.target.value)}
                required
              />
              <input
                type="date"
                value={place.date || ''}
                onChange={e => handlePlaceChange(pIdx, 'date', e.target.value)}
              />
              <textarea
                placeholder="Notes"
                value={place.notes || ''}
                onChange={e => handlePlaceChange(pIdx, 'notes', e.target.value)}
              />

              <div className="place-links">
                <label>Useful Links</label>
                {Array.isArray(place.links) ? place.links.map((link, lIdx) => (
                  <input
                    key={lIdx}
                    type="url"
                    placeholder="Link URL"
                    value={link || ''}
                    onChange={e => handleLinkChange(pIdx, lIdx, e.target.value)}
                  />
                )) : null}
                <button type="button" onClick={() => addLink(pIdx)}>Add Link</button>
              </div>

              <div className="place-images">
                <label>Place Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => handlePlaceImagesChange(pIdx, e)}
                />
              </div>

              <div className="activities-section">
                <label>Activities</label>
                {Array.isArray(place.activities) ? place.activities.map((activity, aIdx) => (
                  <div key={aIdx} className="activity-row">
                    <input
                      type="text"
                      placeholder="Activity Name *"
                      value={activity.name || ''}
                      onChange={e => handleActivityChange(pIdx, aIdx, 'name', e.target.value)}
                      required
                    />
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost"
                      value={activity.cost || ''}
                      onChange={e => handleActivityChange(pIdx, aIdx, 'cost', e.target.value)}
                    />
                    <select 
                      value={activity.currency || 'USD'}
                      onChange={e => handleActivityChange(pIdx, aIdx, 'currency', e.target.value)}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="activity-images">
                      <label>Activity Images</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => handleActivityImagesChange(pIdx, aIdx, e)}
                      />
                    </div>
                  </div>
                )) : null}
                <button type="button" onClick={() => addActivity(pIdx)}>Add Activity</button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addPlace} className="add-place-btn">Add Place</button>

          <div className="modal-buttons">
            <button type="submit" className="save-btn">Save Changes</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditItinerary;

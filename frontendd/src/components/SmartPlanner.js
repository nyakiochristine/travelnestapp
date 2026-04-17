import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Reuse your dashboard styles

function SmartPlanner({ token, onCreated }) {
  const [title, setTitle] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  // Load the seeded landmarks from your database
  useEffect(() => {
    fetch('http://localhost:3001/api/attractions')
      .then(res => res.json())
      .then(data => setAttractions(data))
      .catch(err => console.error("Error fetching landmarks:", err));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/smart-planner/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          title, 
          baseAttractionId: selectedId // The key for the ML route
        })
      });

      if (res.ok) {
        alert("ML Engine has generated your regional itinerary!");
        setTitle('');
        setSelectedId('');
        onCreated(); // Refresh the list on the Dashboard
      }
    } catch (err) {
      console.error("ML Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-card ml-planner-box">
      <div className="tool-header">
        <span className="badge">AI Powered</span>
        <h3>Smart Regional Planner</h3>
      </div>
      <p className="tool-desc">Pick one landmark. Our K-means algorithm will find neighboring SMEs and attractions to build your trip.</p>
      
      <form onSubmit={handleGenerate} className="tool-form">
        <input 
          type="text" 
          placeholder="Give your trip a name..." 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          required 
        />
        
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} required>
          <option value="">-- Select a Starting Landmark --</option>
          {attractions.map(attr => (
            <option key={attr._id} value={attr._id}>
              {attr.name} ({attr.location})
            </option>
          ))}
        </select>

        <button type="submit" className="btn-ml" disabled={loading || !selectedId}>
          {loading ? "Clustering Data..." : "Generate Optimized Itinerary"}
        </button>
      </form>
    </div>
  );
}

export default SmartPlanner;
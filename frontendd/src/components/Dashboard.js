import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import TravelJournal from './CreateItinerary';
import SmartPlanner from './SmartPlanner';
import './Dashboard.css';

// --- SUB-COMPONENTS ---
function AddLandmark({ token }) {
  const [formData, setFormData] = useState({ name: '', location: '', lat: '', lng: '', category: 'Wildlife' });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/attractions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) { 
        alert("Landmark added!"); 
        setFormData({ name: '', location: '', lat: '', lng: '', category: 'Wildlife' }); 
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="tool-card admin-card">
      <h3>SME Portal: Add Attraction</h3>
      <form onSubmit={handleSubmit} className="tool-form">
        <input type="text" placeholder="Attraction Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <div className="form-row">
          <input type="number" step="any" placeholder="Lat" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} required />
          <input type="number" step="any" placeholder="Lng" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} required />
        </div>
        <button type="submit" className="btn-primary">Add Landmark</button>
      </form>
    </div>
  );
}

function PlanTrip({ token, onCreated }) {
  const [attractions, setAttractions] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/attractions')
      .then(res => res.json())
      .then(data => setAttractions(data));
  }, []);

  const handleGenerate = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/smart-planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, baseAttractionId: selectedId })
      });
      if (res.ok) { 
        alert("ML-Optimized Itinerary Generated!"); 
        onCreated(); 
        setTitle(''); 
        setSelectedId(''); 
      } else {
        const errorData = await res.json();
        console.error("Generation failed:", errorData.message);
      }
    } catch (err) { 
      console.error("Fetch error during generation:", err); 
    }
  };

  return (
    <div className="tool-card user-card">
      <h3>AI Smart Planner</h3>
      <div className="tool-form">
        <input type="text" placeholder="Trip Title" value={title} onChange={e => setTitle(e.target.value)} />
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">-- Choose Base Landmark --</option>
          {attractions.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
        </select>
        <button onClick={handleGenerate} className="btn-secondary" disabled={!selectedId || !title}>Generate Optimized Trip</button>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD ---
function Dashboard() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [itineraries, setItineraries] = useState([]);
  const [activeTab, setActiveTab] = useState('planner'); 
  const [editingItinerary, setEditingItinerary] = useState(null);


  const fetchItineraries = async () => {
    if (!token) return;
    try {
      // Changed URL to match the 'my-itineraries' route
      const response = await fetch('http://localhost:3001/api/itineraries/my-itineraries', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setItineraries(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error('Dashboard fetch failed:', err); }
  };


  useEffect(() => { 
    fetchItineraries(); 
  }, [token]);

  if (!token) return <div className="dashboard-container"><p>Please log in.</p></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="travel">Travel</span>
          <span className="nest">Nest</span>
        </h1>
        <p>Welcome back, {user.user?.name || 'Traveler'}</p>
      </header>

      {/* --- TAB NAVIGATION --- */}
      <div className="tab-navigation">
        <button className={activeTab === 'planner' ? 'active' : ''} onClick={() => setActiveTab('planner')}> ✨ AI Planner </button>
        <button className={activeTab === 'journal' ? 'active' : ''} onClick={() => setActiveTab('journal')}>📖 Travel Journal</button>
        <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>🛠️ SME Portal</button>
      </div>

      {/* --- ACTIVE TOOL AREA --- */}
      <div className="tool-display-area">
        {activeTab === 'planner' && <PlanTrip token={token} onCreated={fetchItineraries} />}
        {activeTab === 'journal' && <TravelJournal token={token} onCreated={fetchItineraries} />}
        {activeTab === 'admin' && <AddLandmark token={token} />}
      </div>

      <hr className="divider" />

      {/* --- HISTORY SECTION --- */}
      <section className="itinerary-list-section">
        <h2>Your Personal Journeys</h2>
        <div className="itinerary-grid">
          {itineraries.length === 0 ? (
            <p className="empty-msg">You haven't created any journeys yet.</p>
          ) : (
            itineraries.map((it) => (
              <div key={it._id} className="itinerary-card">
                <div className="card-header">
                  {it.tripCoverImage && (
                    <img src={`http://localhost:3001${it.tripCoverImage}`} alt="Cover" />
                  )}
                  <h3>{it.title}</h3>
                </div>
                <div className="card-body">
                  <p>{it.places?.length || 0} Places Visited</p>
                  <button className="btn-edit" onClick={() => setEditingItinerary(it)}>Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
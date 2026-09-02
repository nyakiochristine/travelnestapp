import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import TravelJournal from './CreateItinerary';
import EditItinerary from './EditItinerary';
import SmartPlanner from './SmartPlanner';
import SMEPortal from './SMEPortal';
import './Dashboard.css';

// --- SUB-COMPONENTS ---
// --- MAIN DASHBOARD ---
function Dashboard({ initialTab = 'planner' }) {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [itineraries, setItineraries] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab); 
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [message, setMessage] = useState('');


  const fetchItineraries = async () => {
    if (!token) return;
    try {
      // Changed URL to match the 'my-itineraries' route
      const response = await fetch(window.__TRAVELNEST_API_URL__ + '/api/itineraries/my-itineraries', {
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

  const deleteItinerary = async (itinerary) => {
    if (!window.confirm(`Delete “${itinerary.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${window.__TRAVELNEST_API_URL__}/api/itineraries/${itinerary._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not delete this journey.');
      setItineraries(current => current.filter(item => item._id !== itinerary._id));
      setMessage('Journey deleted.');
    } catch (error) { setMessage(error.message); }
  };

  if (!token) return <div className="dashboard-container"><p>Please log in.</p></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <p className="dashboard-kicker">Your travel space</p>
        <h1 className="dashboard-title">Your workspace</h1>
        <p>Plan a new route or pick up an itinerary you have already started.</p>
      </header>

      {/* --- TAB NAVIGATION --- */}
      <div className="tab-navigation">
        <button className={activeTab === 'planner' ? 'active' : ''} onClick={() => setActiveTab('planner')}>Smart planner</button>
        <button className={activeTab === 'journal' ? 'active' : ''} onClick={() => setActiveTab('journal')}>Trip builder</button>
        <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setActiveTab('admin')}>Business workspace</button>
      </div>

      {/* --- ACTIVE TOOL AREA --- */}
      <div className="tool-display-area">
        {activeTab === 'planner' && <SmartPlanner token={token} onCreated={fetchItineraries} />}
        {activeTab === 'journal' && <TravelJournal token={token} onCreate={fetchItineraries} />}
        {activeTab === 'admin' && <SMEPortal token={token} />}
      </div>

      <hr className="divider" />

      {/* --- HISTORY SECTION --- */}
      <section className="itinerary-list-section">
        <div className="itinerary-section-heading"><div><p className="section-label">Your library</p><h2>Your itineraries</h2></div><span>{itineraries.length} saved</span></div>
        {message && <div className="dashboard-message">{message}<button onClick={() => setMessage('')}>×</button></div>}
        <div className="itinerary-grid">
          {itineraries.length === 0 ? (
            <div className="workspace-empty"><p className="section-label">Nothing here yet</p><h3>Start with a place you want to see.</h3><p>Use the planner for a quick route, or build an itinerary stop by stop.</p><button className="btn-primary" onClick={() => setActiveTab('planner')}>Open smart planner</button></div>
          ) : (
            itineraries.map((it) => (
              <div key={it._id} className="itinerary-card">
                <div className="card-header">
                  {it.tripCoverImage && (
                    <img src={`${window.__TRAVELNEST_API_URL__}${it.tripCoverImage}`} alt="Cover" />
                  )}
                  <h3>{it.title}</h3>
                </div>
                <div className="card-body">
                  <p>{it.places?.length || 0} Places Visited</p>
                  <div className="journey-card-actions">
                    <button className="btn-edit" onClick={() => setEditingItinerary(it)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteItinerary(it)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      {editingItinerary && (
        <EditItinerary
          itinerary={editingItinerary}
          onClose={() => setEditingItinerary(null)}
          onSave={(updated) => {
            setItineraries(current => current.map(item => item._id === updated._id ? updated : item));
            setEditingItinerary(null);
            setMessage('Journey updated.');
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;

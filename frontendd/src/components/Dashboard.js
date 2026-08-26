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

  const deleteItinerary = async (itinerary) => {
    if (!window.confirm(`Delete “${itinerary.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/itineraries/${itinerary._id}`, {
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
        {activeTab === 'planner' && <SmartPlanner token={token} onCreated={fetchItineraries} />}
        {activeTab === 'journal' && <TravelJournal token={token} onCreate={fetchItineraries} />}
        {activeTab === 'admin' && <SMEPortal token={token} />}
      </div>

      <hr className="divider" />

      {/* --- HISTORY SECTION --- */}
      <section className="itinerary-list-section">
        <h2>Your Personal Journeys</h2>
        {message && <div className="dashboard-message">{message}<button onClick={() => setMessage('')}>×</button></div>}
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

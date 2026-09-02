import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Profiles.css';

const Profiles = () => {
  const [users, setUsers] = useState([]);
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const shownUsers = users.filter(profile => `${profile.name || ''} ${profile.location || ''} ${profile.bio || ''}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    // Fetch all users from backend
    fetch(window.__TRAVELNEST_API_URL__ + '/api/users', { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Profiles fetch error:', err));
  }, [user?.token]);

  return (
    <div className="profiles-container">
      <header className="profiles-hero"><span>TRAVEL COMMUNITY</span><h1>Find your next travel circle</h1><p>Meet travellers, swap local knowledge, and follow journeys that inspire your own.</p><div className="community-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name, location or travel style" aria-label="Search travellers" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</div><small className="search-count">{shownUsers.length} traveller{shownUsers.length === 1 ? '' : 's'} found</small></header>
      <div className="profiles-grid">
        {shownUsers.map(profile => (
          <Link
            key={profile._id}
            to={`/profile/${profile._id}`}
            className="profile-card"
          >
            {profile.profilePicture?.startsWith('/uploads/') ? <img src={`${window.__TRAVELNEST_API_URL__}${profile.profilePicture}`} alt={profile.name} /> : <div className="profile-initial" aria-hidden="true">{profile.name?.charAt(0)?.toUpperCase() || 'T'}</div>}
            <div className="profile-card-copy"><h3>{profile.name}</h3><p className="profile-location">{profile.location || 'Kenya traveller'}</p><p>{profile.bio || 'Building their next great journey.'}</p><span>View profile →</span></div>
          </Link>
        ))}
        {!shownUsers.length && <p className="profiles-empty">No travellers match that search yet.</p>}
      </div>
    </div>
  );
};

export default Profiles;

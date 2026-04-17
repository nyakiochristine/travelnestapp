import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Profiles = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch all users from backend
    fetch('http://localhost:3001/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('Profiles fetch error:', err));
  }, []);

  return (
    <div className="profiles-container">
      <h2>All Profiles</h2>
      <div className="profiles-grid">
        {users.map(profile => (
          <Link
            key={profile._id}
            to={`/profile/${profile._id}`}
            className="profile-card"
          >
            <img
              src={profile.profilePicture || '/default-avatar.png'}
              alt={profile.name}
            />
            <h3>{profile.name}</h3>
            <p>{profile.bio || 'No bio available'}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Profiles;

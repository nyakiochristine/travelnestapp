import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Profiles = () => {
  const [users, setUsers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Fetch all users from backend
    fetch('http://localhost:3001/api/users', { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => res.json())
      .then(setUsers)
      .catch(err => console.error('Profiles fetch error:', err));
  }, [user?.token]);

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

// src/components/Navbar.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openNotif, setOpenNotif] = useState(false);
  const dropdownRef = useRef(null);

  const notifications = user
    ? [
        { id: 1, text: 'Ken liked your itinerary “Malindi 4 day trip”', time: '2h ago' },
        { id: 2, text: 'Anita saved your itinerary “Coastal trip”', time: '5h ago' },
        { id: 3, text: 'Max started following you', time: '1d ago' }
      ]
    : [];
  const unreadCount = notifications.length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDropdown = () => setOpenNotif(prev => !prev);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenNotif(false);
      }
    }
    if (openNotif) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openNotif]);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">TravelNest</Link>
      </div>

      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/itineraries">Itineraries</Link>
            <Link to="/create">Create</Link>
            <Link to="/edit-profile">Edit Profile</Link>

            {user.user && (
              <Link
                to={`/profile/${user.user._id}`}
                className="nav-profile-link"
              >
                My Profile
              </Link>
            )}

            {/* Messages link/icon */}
            <Link to="/messages" className="nav-icon-link" title="Messages">
              💬
            </Link>

            {/* Notifications bell */}
            <div className="nav-notifications" ref={dropdownRef}>
              <button
                type="button"
                className="notif-bell"
                onClick={toggleDropdown}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {openNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Activity</div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No new activity yet.</div>
                  ) : (
                    <ul className="notif-list">
                      {notifications.map(n => (
                        <li key={n.id} className="notif-item">
                          <div className="notif-dot" />
                          <div className="notif-text">
                            <span>{n.text}</span>
                            <small>{n.time}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

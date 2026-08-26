// src/components/Navbar.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [openNotif, setOpenNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(notification => !notification.read).length;

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

  useEffect(() => {
    if (!user?.token) return setNotifications([]);
    fetch('http://localhost:3001/api/notifications', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(response => response.ok ? response.json() : [])
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]));
  }, [user?.token]);

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
                        <li key={n._id} className="notif-item">
                          <div className="notif-dot" />
                          <div className="notif-text">
                            <span>{n.actor?.name || 'Someone'} {n.type === 'follow' ? 'started following you' : `${n.type}d your`} {n.itinerary?.title ? `itinerary “${n.itinerary.title}”` : 'profile'}</span>
                            <small>{new Date(n.createdAt).toLocaleDateString()}</small>
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

// src/components/ProfileEdit.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    twitter: '',
    facebook: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && user.user) {
      console.log('🔍 Loading form data for user:', user.user._id, user.user.name);
      setFormData({
        name: user.user.name || '',
        bio: user.user.bio || '',
        location: user.user.location || '',
        website: user.user.website || '',
        instagram: user.user.instagram || '',
        twitter: user.user.twitter || '',
        facebook: user.user.facebook || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    if (profilePicture) {
      formDataToSend.append('profilePicture', profilePicture);
    }

    try {
      console.log('🚀 Submitting profile update for user:', user?.user?._id);

      const response = await fetch('http://localhost:3001/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      console.log('🔍 Backend response data:', data);
      console.log('🔍 Backend response status:', response.status);

      if (response.ok) {
        setMessage('Profile updated successfully! ✅');

        // Update AuthContext
        if (login && data) {
          login({ token: user.token, user: data });
        }

        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ token: user.token, user: data }));

        console.log('✅ Updated user ID (from response):', data._id);

        // Safe redirect using response id or fallback from current user
        setTimeout(() => {
          const responseId = data._id || data.id;
          const fallbackId = user?.user?._id;
          const finalId = responseId || fallbackId;

          console.log('➡️ redirect id:', { responseId, fallbackId, finalId });

          if (finalId) {
            console.log('🚀 Navigating to:', `/profile/${finalId}`);
            navigate(`/profile/${finalId}`, { replace: true });
          } else {
            console.error('❌ No usable id for redirect, going to /itineraries');
            navigate('/itineraries');
          }
        }, 1500);

      } else {
        setMessage(data.error || 'Update failed');
        console.error('❌ Update failed:', data);
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('💥 Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel clicked, going back');
    navigate(-1);
  };

  if (!user || !user.token) {
    return <div className="error">Please log in to edit profile</div>;
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-card">
        <h2>Edit Profile</h2>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-form">
          {/* Profile Picture */}
          <div className="profile-pic-section">
            <img 
              src={
                user.user.profilePicture 
                  ? `http://localhost:3001${user.user.profilePicture}` 
                  : 'http://localhost:3001/images/default-avatar.png'
              } 
              alt="Profile" 
              className="current-avatar"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Bio (max 160 chars)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              maxLength="160"
              className="form-input"
              rows="3"
            />
            <small>{formData.bio.length}/160</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g. Nairobi, Kenya"
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="social-links">
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://instagram.com/username"
              />
            </div>
            <div className="form-group">
              <label>Twitter</label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="form-group">
              <label>Facebook</label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>

          <div className="edit-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;

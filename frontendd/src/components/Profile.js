// src/components/Profile.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Profile.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ itineraryCount: 0 });
  const [itineraries, setItineraries] = useState([]);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  const isOwnProfile = () =>
    currentUser && currentUser.user?._id === userId;

  const getToken = () =>
    currentUser?.token || localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [userId]);

  useEffect(() => {
    if (isOwnProfile()) {
      fetchUserItineraries();
      fetchSavedItineraries();
    }
  }, [userId, currentUser]);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      itineraryCount: itineraries.length,
    }));
  }, [itineraries]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();

      const res = await fetch(
        `http://localhost:3001/api/users/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
        });

        const followers = data.followers || [];
        setFollowersCount(followers.length);
        const meId = currentUser?.user?._id?.toString();
        const following = followers.some(f =>
          (f._id || f).toString() === meId
        );
        setIsFollowing(following);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:3001/api/users/${userId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchUserItineraries = async () => {
    try {
      const token = getToken();
      const res = await fetch(
        'http://localhost:3001/api/itineraries/my-itineraries',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setItineraries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Itineraries fetch error:', err);
    }
  };

  const fetchSavedItineraries = async () => {
    try {
      const token = getToken();
      const res = await fetch(
        'http://localhost:3001/api/itineraries/saved',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSavedItineraries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Saved itineraries fetch error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();

    Object.keys(formData).forEach(key => {
      if (key !== 'profilePicture') {
        submitData.append(key, formData[key] || '');
      }
    });

    if (formData.profilePicture) {
      submitData.append('profilePicture', formData.profilePicture);
    }

    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setIsEditing(false);

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...storedUser,
            user: updatedProfile,
          })
        );
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const token = getToken();
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(
        `http://localhost:3001/api/users/${userId}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        setFollowersCount(data.followersCount);
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    }
  };

  const handleMessageUser = async () => {
    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:3001/api/chat/direct/${userId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return;
      const convo = await res.json();
      navigate(`/messages?c=${convo._id}`);
    } catch (err) {
      console.error('Open DM error:', err);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="error">Profile not found</div>;

  const ownProfile = isOwnProfile();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={
            profile.profilePicture
              ? `http://localhost:3001${profile.profilePicture}`
              : '/default-avatar.png'
          }
          alt="Profile"
          className="profile-picture"
        />
        <div className="profile-info">
          <h1>{profile.name}</h1>
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}
          <div className="profile-stats-row">
            <div className="profile-stats">
              <span><strong>{stats.itineraryCount}</strong> Itineraries</span>
              <span><strong>{followersCount}</strong> Followers</span>
              <span><strong>{profile.following?.length || 0}</strong> Following</span>
            </div>

            {!ownProfile && currentUser && (
              <div className="profile-actions-row">
                <button
                  onClick={handleToggleFollow}
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  type="button"
                  className="message-btn"
                  onClick={handleMessageUser}
                >
                  Message
                </button>
              </div>
            )}
          </div>
          {profile.location && (
            <p className="profile-location">{profile.location}</p>
          )}
        </div>
      </div>

      {ownProfile && (
        <div className="profile-actions">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="edit-profile-btn"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      )}

      {isEditing && ownProfile && (
        <form
          onSubmit={handleSubmit}
          className="profile-edit-form"
        >
          <div className="edit-form-group">
            <label>Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData(prev => ({
                    ...prev,
                    profilePicture: file,
                  }));
                }
              }}
            />
          </div>

          <div className="edit-form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="edit-form-group">
            <label>Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
              rows="3"
              maxLength="160"
            />
          </div>

          <div className="edit-form-row">
            <div className="edit-form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>
            <div className="edit-form-group">
              <label>Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="edit-form-row">
            <div className="edit-form-group">
              <label>Instagram</label>
              <input
                type="text"
                value={formData.instagram || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    instagram: e.target.value,
                  }))
                }
              />
            </div>
            <div className="edit-form-group">
              <label>Twitter</label>
              <input
                type="text"
                value={formData.twitter || ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    twitter: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="edit-form-group">
            <label>Facebook</label>
            <input
              type="text"
              value={formData.facebook || ''}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  facebook: e.target.value,
                }))
              }
            />
          </div>

          <button
            type="submit"
            className="save-profile-btn"
          >
            Save Profile
          </button>
        </form>
      )}

      <div className="profile-social-links">
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            🌐 Website
          </a>
        )}
        {profile.instagram && (
          <a
            href={`https://instagram.com/${profile.instagram.replace(
              'https://instagram.com/',
              ''
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📸 Instagram
          </a>
        )}
        {profile.twitter && (
          <a
            href={`https://twitter.com/${profile.twitter.replace(
              'https://twitter.com/',
              ''
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            🐦 Twitter
          </a>
        )}
        {profile.facebook && (
          <a
            href={profile.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            📘 Facebook
          </a>
        )}
      </div>

      {ownProfile && (
        <div className="profile-itineraries">
          <div className="profile-itineraries-header">
            <h2 className="section-title">Itineraries</h2>
            <div className="profile-itineraries-tabs">
              <button
                type="button"
                className={
                  activeTab === 'created'
                    ? 'tab-btn active'
                    : 'tab-btn'
                }
                onClick={() => setActiveTab('created')}
              >
                Your Itineraries
              </button>
              <button
                type="button"
                className={
                  activeTab === 'saved'
                    ? 'tab-btn active'
                    : 'tab-btn'
                }
                onClick={() => setActiveTab('saved')}
              >
                Saved Itineraries
              </button>
            </div>
          </div>

          {activeTab === 'created' ? (
            itineraries.length > 0 ? (
              <div className="itineraries-grid">
                {itineraries.map((itinerary) => (
                  <Link
                    key={itinerary._id}
                    to={`/itineraries/${itinerary._id}`}
                    className="itinerary-card"
                  >
                    {itinerary.tripCoverImage && (
                      <img
                        src={`http://localhost:3001${itinerary.tripCoverImage}`}
                        alt={itinerary.title}
                        className="itinerary-cover"
                      />
                    )}
                    <div className="itinerary-info">
                      <h3 className="itinerary-title">
                        {itinerary.title}
                      </h3>
                      <p className="itinerary-dates">
                        {itinerary.tripStart &&
                          new Date(
                            itinerary.tripStart
                          ).toLocaleDateString()}
                        {itinerary.tripEnd &&
                          ` - ${new Date(
                            itinerary.tripEnd
                          ).toLocaleDateString()}`}
                      </p>
                      <p className="itinerary-places">
                        {itinerary.places?.length || 0} place
                        {itinerary.places?.length !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty-message">
                You have not created any itineraries yet.
              </p>
            )
          ) : savedItineraries.length > 0 ? (
            <div className="itineraries-grid">
              {savedItineraries.map((itinerary) => (
                <Link
                  key={itinerary._id}
                  to={`/itineraries/${itinerary._id}`}
                  className="itinerary-card"
                >
                  {itinerary.tripCoverImage && (
                    <img
                      src={`http://localhost:3001${itinerary.tripCoverImage}`}
                      alt={itinerary.title}
                      className="itinerary-cover"
                    />
                  )}
                  <div className="itinerary-info">
                    <h3 className="itinerary-title">
                      {itinerary.title}
                    </h3>
                    <p className="itinerary-dates">
                      {itinerary.tripStart &&
                        new Date(
                          itinerary.tripStart
                        ).toLocaleDateString()}
                      {itinerary.tripEnd &&
                        ` - ${new Date(
                          itinerary.tripEnd
                        ).toLocaleDateString()}`}
                    </p>
                    <p className="itinerary-places">
                      by {itinerary.user?.name || 'Traveler'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-message">
              You have not saved any itineraries yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;

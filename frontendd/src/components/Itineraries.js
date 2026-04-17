import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import html2pdf from 'html2pdf.js';
import Search from './Search';
import './Itineraries.css';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function Itineraries() {
  const { user } = useContext(AuthContext);
  const [itineraries, setItineraries] = useState([]);
  const [filteredItineraries, setFilteredItineraries] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareItinerary, setShareItinerary] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);

  const token = user?.token;

  useEffect(() => {
    if (!user || !user.token) return;

    fetch('http://localhost:3001/api/itineraries', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setItineraries(list);
        setFilteredItineraries(list);
      })
      .catch(err => console.error('Fetch Feed Error:', err));
  }, [user]);

  const updateItineraries = (itineraryId, updateFn) => {
    const applyUpdate = prev => prev.map(it => 
      it._id === itineraryId 
        ? (typeof updateFn === 'function' ? updateFn(it) : { ...it, ...updateFn })
        : it
    );
    setItineraries(applyUpdate);
    setFilteredItineraries(applyUpdate);
  };

  const handleLike = async (itineraryId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/like`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      updateItineraries(itineraryId, { likes: result.likes, liked: result.liked });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSave = async (itineraryId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const result = await response.json();
      const currentUserId = user.user?._id?.toString();

      updateItineraries(itineraryId, (it) => {
        const currentIds = Array.isArray(it.savedBy) ? it.savedBy : [];
        if (result.saved) {
          return { ...it, savedBy: [...currentIds, currentUserId] };
        } else {
          return { ...it, savedBy: currentIds.filter(id => id.toString() !== currentUserId) };
        }
      });
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleAddComment = async (itineraryId) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/api/itineraries/${itineraryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        updateItineraries(itineraryId, (it) => ({
          ...it, 
          comments: [...(it.comments || []), newComment]
        }));
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const openShareModal = async (itinerary) => {
    setShareItinerary(itinerary);
    setShareOpen(true);
    setSelectedTargets([]);
    try {
      const res = await fetch('http://localhost:3001/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const me = await res.json();
        setFollowers(me.followers || []);
      }
    } catch (e) {
      console.error('load followers error', e);
    }
  };

  const handleShareToFollowers = async () => {
    if (!shareItinerary || selectedTargets.length === 0) return;
    try {
      const res = await fetch('http://localhost:3001/api/chat/share-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserIds: selectedTargets,
          itineraryId: shareItinerary._id
        })
      });
      if (res.ok) {
        setShareOpen(false);
        setShareItinerary(null);
      }
    } catch (e) {
      console.error('share itinerary error', e);
    }
  };

  const handleDownload = (itinerary) => {
    const element = document.createElement('div');
    element.innerHTML = `<div style="padding: 20px;"><h1>${itinerary.title}</h1></div>`; // Simplified for example
    html2pdf().from(element).save(`${itinerary.title}.pdf`);
  };

  const handleShareLink = (id, title) => {
      const url = `${window.location.origin}/itineraries/${id}`;
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
  };

  const toggleTarget = (id) => {
    setSelectedTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (!user) {
    return <p className="login-message">Please log in to explore itineraries.</p>;
  }

  // ADDED: The missing 'return' keyword
  return (
    <div className="itineraries-feed">
      <Search 
        itineraries={itineraries} 
        setFilteredItineraries={setFilteredItineraries} 
      />
      
      <h2 className="feed-title">Travel Feed</h2>

      {filteredItineraries.length === 0 ? (
        <p className="empty-message">No itineraries match your filters.</p>
      ) : (
        filteredItineraries.map(it => {
          const userIdStr = user.user?._id?.toString();
          const hasLiked = it.liked || (Array.isArray(it.likes) && it.likes.map(l => l.toString()).includes(userIdStr));
          const hasSaved = Array.isArray(it.savedBy) && it.savedBy.some(id => id.toString() === userIdStr);

          return (
            <article key={it._id} className="feed-card">
              <div className="feed-header">
                {it.user && (
                  <div className="user-header">
                    <img src={it.user.profilePicture || '/default-avatar.png'} alt={it.user.name} className="user-avatar" />
                    <Link to={`/profile/${it.user._id}`} className="username">{it.user.name}</Link>
                  </div>
                )}
                <h3 className="itinerary-title">{it.title}</h3>
              </div>

              <div className="feed-actions">
                <button onClick={() => handleLike(it._id)} className={`feed-btn ${hasLiked ? 'liked' : ''}`}>
                  ❤️ {Array.isArray(it.likes) ? it.likes.length : 0} Likes
                </button>
                <button onClick={() => setActiveCommentId(activeCommentId === it._id ? null : it._id)} className="feed-btn">
                  💬 {it.comments?.length || 0} Comments
                </button>
                <button onClick={() => openShareModal(it)} className="feed-btn">💬 Share to chat</button>
                <button onClick={() => handleSave(it._id)} className={`feed-btn ${hasSaved ? 'saved' : ''}`}>
                   ⭐ {hasSaved ? 'Saved' : 'Save'}
                </button>
              </div>

              {activeCommentId === it._id && (
                <div className="comments-section">
                  <div className="comment-input-row">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." />
                    <button onClick={() => handleAddComment(it._id)}>Post</button>
                  </div>
                  <div className="comments-list">
                    {(it.comments || []).map((c, idx) => (
                      <div key={c._id || idx} className="comment-item">
                        <strong>{c.user?.name || 'Traveler'}: </strong>{c.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}

      {shareOpen && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <h3>Share to Followers</h3>
            {followers.map(f => (
              <div key={f._id}><input type="checkbox" onChange={() => toggleTarget(f._id)} /> {f.name}</div>
            ))}
            <button onClick={handleShareToFollowers}>Share</button>
            <button onClick={() => setShareOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Itineraries;
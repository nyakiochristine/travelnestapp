import React, { useCallback, useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import Search from './Search';
import './Itineraries.css';

const API = 'http://localhost:3001/api';
const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Itineraries() {
  const { user } = useContext(AuthContext);
  const token = user?.token;
  const [itineraries, setItineraries] = useState([]);
  const [filteredItineraries, setFilteredItineraries] = useState([]);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [shareItinerary, setShareItinerary] = useState(null);
  const [travelers, setTravelers] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [notice, setNotice] = useState('');

  const updateTrip = (id, change) => {
    const apply = list => list.map(item => item._id === id ? (typeof change === 'function' ? change(item) : { ...item, ...change }) : item);
    setItineraries(apply); setFilteredItineraries(apply);
  };
  const loadFeed = useCallback(async () => {
    const response = await fetch(`${API}/itineraries`, { headers: { Authorization: `Bearer ${token}` } });
    const data = response.ok ? await response.json() : [];
    setItineraries(Array.isArray(data) ? data : []);
    setFilteredItineraries(Array.isArray(data) ? data : []);
  }, [token]);

  useEffect(() => { if (token) loadFeed().catch(console.error); }, [token, loadFeed]);
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).then(data => setTravelers(Array.isArray(data) ? data.filter(person => person._id !== user.user?._id) : [])).catch(console.error);
  }, [token, user?.user?._id]);

  const request = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Something went wrong');
    return response.json();
  };
  const like = async id => { try { const result = await request(`/itineraries/${id}/like`, { method: 'POST' }); updateTrip(id, { likes: result.likes }); } catch (error) { setNotice(error.message); } };
  const save = async id => {
    try { const result = await request(`/itineraries/${id}/save`, { method: 'POST' }); const me = user.user._id; updateTrip(id, item => ({ ...item, savedBy: result.saved ? [...(item.savedBy || []), me] : (item.savedBy || []).filter(value => value.toString() !== me) })); } catch (error) { setNotice(error.message); }
  };
  const copy = async id => { try { const trip = await request(`/itineraries/${id}/copy`, { method: 'POST' }); setNotice(`Saved “${trip.title}” to your journeys. You can edit it from Dashboard.`); } catch (error) { setNotice(error.message); } };
  const comment = async id => {
    if (!commentText.trim()) return;
    try { const entry = await request(`/itineraries/${id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: commentText.trim() }) }); updateTrip(id, item => ({ ...item, comments: [...(item.comments || []), entry] })); setCommentText(''); } catch (error) { setNotice(error.message); }
  };
  const share = async () => {
    if (!selectedTargets.length) return setNotice('Choose at least one traveller to share with.');
    try { await request('/chat/share-itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserIds: selectedTargets, itineraryId: shareItinerary._id, text: `Thought you would like this route: ${shareItinerary.title}` }) }); setShareItinerary(null); setNotice('Itinerary shared in chat.'); } catch (error) { setNotice(error.message); }
  };
  if (!user) return <p className="login-message">Please log in to explore itineraries.</p>;
  return <main className="itineraries-feed">
    <header className="feed-intro"><div><span className="section-kicker">TravelNest community</span><h1>Find your next great route</h1><p>Real itineraries, thoughtful notes and places worth going out of your way for.</p></div><Link className="feed-create-link" to="/create">＋ Create a trip</Link></header>
    <Search itineraries={itineraries} setFilteredItineraries={setFilteredItineraries} />
    {notice && <div className="feed-notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    {filteredItineraries.length === 0 ? <p className="empty-message">No itineraries match your filters yet.</p> : <section className="feed-list">{filteredItineraries.map(itinerary => {
      const me = user.user?._id;
      const liked = itinerary.likes?.some(id => id.toString() === me);
      const saved = itinerary.savedBy?.some(id => id.toString() === me);
      return <article className="feed-card social-trip-card" key={itinerary._id}>
        <header className="trip-author"><Link to={`/profile/${itinerary.user?._id}`}><img src={itinerary.user?.profilePicture ? `http://localhost:3001${itinerary.user.profilePicture}` : '/default-avatar.png'} alt="" /><span><strong>{itinerary.user?.name || 'TravelNest traveller'}</strong><small>shared a route</small></span></Link><span className="trip-date">{formatDate(itinerary.createdAt)}</span></header>
        <Link className="trip-content-link" to={`/itineraries/${itinerary._id}`}>{itinerary.tripCoverImage && <img className="feed-cover" src={`http://localhost:3001${itinerary.tripCoverImage}`} alt={itinerary.title} />}<div className="trip-content"><h2>{itinerary.title}</h2>{itinerary.description && <p>{itinerary.description}</p>}<div className="trip-stats"><span>🧭 {itinerary.places?.length || 0} stops</span>{itinerary.tripStart && <span>📅 {formatDate(itinerary.tripStart)}{itinerary.tripEnd && ` – ${formatDate(itinerary.tripEnd)}`}</span>}</div>{itinerary.places?.length > 0 && <div className="place-pills">{itinerary.places.slice(0, 3).map((place, index) => <span key={`${place.name}-${index}`}>{place.name}</span>)}{itinerary.places.length > 3 && <span>+{itinerary.places.length - 3} more</span>}</div>}</div></Link>
        <div className="social-counts"><span>{itinerary.likes?.length || 0} likes</span><span>{itinerary.comments?.length || 0} comments</span><span>{itinerary.savedBy?.length || 0} saves</span></div>
        <div className="feed-actions"><button onClick={() => like(itinerary._id)} className={liked ? 'feed-btn is-active' : 'feed-btn'}>{liked ? '♥ Liked' : '♡ Like'}</button><button onClick={() => setActiveCommentId(activeCommentId === itinerary._id ? null : itinerary._id)} className="feed-btn">◌ Comment</button><button onClick={() => { setShareItinerary(itinerary); setSelectedTargets([]); }} className="feed-btn">↗ Share</button><button onClick={() => save(itinerary._id)} className={saved ? 'feed-btn is-active' : 'feed-btn'}>☆ {saved ? 'Saved' : 'Save'}</button><button onClick={() => copy(itinerary._id)} className="feed-btn">⎘ Make mine</button></div>
        {activeCommentId === itinerary._id && <section className="comments-section"><div className="comments-list">{(itinerary.comments || []).map(commentEntry => <p className="comment-item" key={commentEntry._id}><Link to={`/profile/${commentEntry.user?._id}`}>{commentEntry.user?.name || 'Traveller'}</Link> {commentEntry.text}</p>)}</div><div className="comment-input-row"><input value={commentText} onChange={event => setCommentText(event.target.value)} onKeyDown={event => event.key === 'Enter' && comment(itinerary._id)} placeholder="Add a helpful travel note…" /><button onClick={() => comment(itinerary._id)}>Post</button></div></section>}
      </article>;
    })}</section>}
    {shareItinerary && <div className="share-modal-overlay" role="dialog" aria-modal="true"><div className="share-modal"><button className="modal-close" onClick={() => setShareItinerary(null)}>×</button><span className="section-kicker">Share via message</span><h2>{shareItinerary.title}</h2><p>Choose people to send this itinerary to.</p><div className="share-followers-list">{travelers.length ? travelers.map(traveler => <label key={traveler._id}><input type="checkbox" checked={selectedTargets.includes(traveler._id)} onChange={() => setSelectedTargets(current => current.includes(traveler._id) ? current.filter(id => id !== traveler._id) : [...current, traveler._id])} /><span>{traveler.name}</span></label>) : <span>Add another registered traveller to start sharing routes.</span>}</div><button className="share-confirm-btn" onClick={share}>Send itinerary</button></div></div>}
  </main>;
}
export default Itineraries;

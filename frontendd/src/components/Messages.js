// src/components/Messages.js
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Messages.css';

function Messages() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [travelers, setTravelers] = useState([]);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [travelerQuery, setTravelerQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(window.__TRAVELNEST_API_URL__ + '/api/chat/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token || !activeConvo) return;
    const timer = setInterval(async () => {
      const response = await fetch(`${window.__TRAVELNEST_API_URL__}/api/chat/${activeConvo._id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setMessages(await response.json());
    }, 8000);
    return () => clearInterval(timer);
  }, [token, activeConvo]);

  useEffect(() => {
    if (!token) return;
    fetch(window.__TRAVELNEST_API_URL__ + '/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : [])
      .then(data => setTravelers(Array.isArray(data) ? data.filter(person => person._id !== user.user?._id) : []))
      .catch(console.error);
  }, [token, user.user?._id]);

  const startConversation = async (traveler) => {
    try {
      const response = await fetch(`${window.__TRAVELNEST_API_URL__}/api/chat/direct/${traveler._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Could not start this conversation.');
      const conversation = await response.json();
      setConversations(previous => previous.some(item => item._id === conversation._id) ? previous : [conversation, ...previous]);
      setShowNewMessage(false);
      loadMessages(conversation);
    } catch (error) { setError(error.message); }
  };

  const loadMessages = async (convo) => {
    setActiveConvo(convo);
    try {
      const res = await fetch(
        `${window.__TRAVELNEST_API_URL__}/api/chat/${convo._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConvo || (!text.trim() && !selectedImage)) return;

    setError('');

    const formData = new FormData();
    if (text.trim()) formData.append('text', text.trim());
    if (selectedImage) formData.append('image', selectedImage);

    const res = await fetch(
      `${window.__TRAVELNEST_API_URL__}/api/chat/${activeConvo._id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    );
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setText('');
      setSelectedImage(null);
      setConversations(previous => previous.map(conversation => conversation._id === activeConvo._id ? { ...conversation, latestMessage: msg, updatedAt: new Date().toISOString() } : conversation).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } else setError('Your message could not be sent. Please try again.');
  };

  if (!token) {
    return (
      <p className="login-message">
        Please log in to use messages.
      </p>
    );
  }

  return (
    <div className="messages-layout">
      <aside className="convo-list">
        <h2>Messages</h2>
        <button className="new-message-btn" onClick={() => setShowNewMessage(value => !value)}>＋ New message</button>
        {showNewMessage && (
          <div className="traveler-picker">
            <p>Start a conversation</p>
            <input value={travelerQuery} onChange={event => setTravelerQuery(event.target.value)} placeholder="Search travellers…" />
            {travelers.filter(traveler => traveler.name.toLowerCase().includes(travelerQuery.toLowerCase())).length ? travelers.filter(traveler => traveler.name.toLowerCase().includes(travelerQuery.toLowerCase())).map(traveler => <button key={traveler._id} onClick={() => startConversation(traveler)}><img src={traveler.profilePicture ? `${window.__TRAVELNEST_API_URL__}${traveler.profilePicture}` : '/default-avatar.png'} alt="" />{traveler.name}</button>) : <span>No other travellers yet.</span>}
          </div>
        )}
        {conversations.map(c => {
          const others = (c.members || []).filter(
            m => m._id !== user.user._id
          );
          const label =
            c.type === 'group'
              ? c.name || 'Group chat'
              : (others[0]?.name || 'Direct chat');

          return (
            <button
              key={c._id}
              className={
                activeConvo && activeConvo._id === c._id
                  ? 'convo-item active'
                  : 'convo-item'
              }
              onClick={() => loadMessages(c)}
            ><span className="conversation-avatar">{c.type === 'group' ? '✦' : label.charAt(0)}</span><span className="conversation-copy"><strong>{label}</strong><small>{c.latestMessage?.itinerary?.title ? `Shared: ${c.latestMessage.itinerary.title}` : c.latestMessage?.text || 'Start planning together'}</small></span>
            </button>
          );
        })}
      </aside>

      <section className="chat-panel">
        {activeConvo ? (
          <>
            <div className="chat-header">
              <span className="chat-avatar">{activeConvo.type === 'group' ? '✦' : ((activeConvo.members || []).find(member => member._id !== user.user._id)?.name || 'T').charAt(0)}</span>
              <div><h3>
                {activeConvo.type === 'group'
                  ? activeConvo.name
                  : ((activeConvo.members || []).find(member => member._id !== user.user._id)?.name || 'Conversation')}
              </h3><p>Travel chat · share routes, stays and local tips</p></div>
            </div>

            <div className="chat-messages">
              <div className="chat-day-label">Conversation</div>
              {messages.map(m => (
                <div
                  key={m._id}
                  className={
                    m.sender?._id === user.user._id
                      ? 'msg-row own'
                      : 'msg-row'
                  }
                >
                  <div className="msg-bubble">
                    <div className="msg-sender">
                      {m.sender?.name || 'Traveler'}
                    </div>

                    {m.text && (
                      <div className="msg-text">{m.text}</div>
                    )}

                    {m.image && (
                      <img
                        src={
                          m.image.startsWith('http')
                            ? m.image
                            : `${window.__TRAVELNEST_API_URL__}${m.image}`
                        }
                        alt="Attachment"
                        className="msg-image"
                      />
                    )}

                    {m.itinerary && (
                      <Link
                        to={`/itineraries/${m.itinerary._id}`}
                        className="msg-itinerary"
                      >
                        <img
                          src={
                            m.itinerary.tripCoverImage
                              ? `${window.__TRAVELNEST_API_URL__}${m.itinerary.tripCoverImage}`
                              : '/default-trip.png'
                          }
                          alt={m.itinerary.title}
                        />
                        <span>{m.itinerary.title}</span>
                      </Link>
                    )}

                    {/* status label for messages I sent */}
                    <div className="msg-meta">
                      {m.sender?._id === user.user._id && (
                        <span
                          className={`msg-status status-${m.status || 'sent'}`}
                        >
                          {m.status || 'sent'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={handleSend}>
              {selectedImage && (
                <div className="chat-image-preview">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected preview"
                  />
                  <button type="button" onClick={() => setSelectedImage(null)}>Remove</button>
                </div>
              )}

              <div className="chat-input-actions">
                <label className="attach-image-btn">
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setSelectedImage(e.target.files?.[0] || null)}
                  />
                </label>

                <input
                  type="text"
                  placeholder="Write a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <button type="submit">Send</button>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <div><strong>Your travel conversations live here.</strong><br />Choose a chat or start a new one to share plans, tips and routes.</div>
          </div>
        )}
        {error && <div className="chat-error">{error}</div>}
      </section>
    </div>
  );
}

export default Messages;

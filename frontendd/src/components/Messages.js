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
  const [travelers, setTravelers] = useState([]);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3001/api/chat/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3001/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : [])
      .then(data => setTravelers(Array.isArray(data) ? data.filter(person => person._id !== user.user?._id) : []))
      .catch(console.error);
  }, [token, user.user?._id]);

  const startConversation = async (traveler) => {
    try {
      const response = await fetch(`http://localhost:3001/api/chat/direct/${traveler._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const conversation = await response.json();
      setConversations(previous => previous.some(item => item._id === conversation._id) ? previous : [conversation, ...previous]);
      setShowNewMessage(false);
      loadMessages(conversation);
    } catch (error) { console.error(error); }
  };

  const loadMessages = async (convo) => {
    setActiveConvo(convo);
    try {
      const res = await fetch(
        `http://localhost:3001/api/chat/${convo._id}/messages`,
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
    if (!activeConvo || !text.trim()) return;

    const res = await fetch(
      `http://localhost:3001/api/chat/${activeConvo._id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() })
      }
    );
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setText('');
    }
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
            {travelers.length ? travelers.map(traveler => <button key={traveler._id} onClick={() => startConversation(traveler)}>{traveler.name}</button>) : <span>No other travellers yet.</span>}
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
            >
              {label}
            </button>
          );
        })}
      </aside>

      <section className="chat-panel">
        {activeConvo ? (
          <>
            <div className="chat-header">
              <h3>
                {activeConvo.type === 'group'
                  ? activeConvo.name
                  : 'Conversation'}
              </h3>
            </div>

            <div className="chat-messages">
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

                    {m.itinerary && (
                      <Link
                        to={`/itineraries/${m.itinerary._id}`}
                        className="msg-itinerary"
                      >
                        <img
                          src={
                            m.itinerary.tripCoverImage
                              ? `http://localhost:3001${m.itinerary.tripCoverImage}`
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
              <input
                type="text"
                placeholder="Write a message..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <div><strong>Your travel conversations live here.</strong><br />Choose a chat or start a new one to share plans, tips and routes.</div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Messages;

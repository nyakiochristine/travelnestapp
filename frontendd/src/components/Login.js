import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Login.css';

function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setSubmitting(true); setFeedback('');
      const response = await fetch(window.__TRAVELNEST_API_URL__ + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login({ token: data.token, user: data.user });
        setFeedback('Welcome back. Taking you to your trip planner…');
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        setFeedback(data.error || 'We could not sign you in. Please check your details.');
      }
    } catch (error) {
      setFeedback('We could not reach TravelNest. Please try again.');
      console.error('Login error:', error);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="login-container">
      <h1 className="logo">
        <span className="travel">Travel</span>
        <span className="nest">Nest</span>
      </h1>

      <form onSubmit={handleSubmit} className="login-form">
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          className="input-field"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn-login" disabled={submitting}>{submitting ? 'Signing you in…' : 'Login'}</button>
      </form>

      {feedback && <p className="auth-feedback" role="status">{feedback}</p>}

      <div style={{ marginTop: '12px' }}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
    </div>
  );
}

export default Login;

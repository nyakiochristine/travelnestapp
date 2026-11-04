import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

function Register() {
  const [name, setName] = useState('');  // changed from username to name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    try {
      setSubmitting(true);
      const response = await fetch(window.__TRAVELNEST_API_URL__ + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      setError(response.ok ? data.message : (data.error || 'Registration failed.'));
    } catch (_error) {
      setError('We could not reach TravelNest. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <h1 className="logo">
        <span className="travel">Travel</span>
        <span className="nest">Nest</span>
      </h1>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          className="input-field"
          placeholder="Name"
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="Email"
          type="email"
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="Password"
          type="password"
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input className="input-field" placeholder="Confirm password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <p className="password-hint">Use at least 8 characters, including a letter and a number.</p>
        <button type="submit" className="btn-register" disabled={submitting}>{submitting ? 'Creating account…' : 'Register'}</button>
      </form>
      {error && <p className="auth-message" role="status">{error}</p>}
      <Link className="auth-link" to="/login">Already have an account? Log in</Link>
    </div>
  );
}

export default Register;

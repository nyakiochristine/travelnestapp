import React, { useState } from 'react';
import './Register.css';

function Register() {
  const [name, setName] = useState('');  // changed from username to name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationLink, setVerificationLink] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }), // send name, email, password
    });
    const data = await response.json();
    if (response.ok) { setVerificationLink(data.verificationLink || ''); setError(data.message); } else setError(data.error || 'Registration failed.');
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
        <button type="submit" className="btn-register">Register</button>
      </form>
      {error && <p className="auth-message">{error}</p>}
      {verificationLink && <a className="auth-link" href={verificationLink}>Development only: verify email and continue</a>}
    </div>
  );
}

export default Register;

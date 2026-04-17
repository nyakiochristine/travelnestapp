import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Login.css';

function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login({ token: data.token, user: data.user });
        alert('Login successful');
        navigate('/dashboard');
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      alert('Network error, please try again.');
      console.error('Login error:', error);
    }
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

        <button type="submit" className="btn-login">Login</button>
      </form>

      <div style={{ marginTop: '12px' }}>
        <Link to="/forgot-password">Forgot Password?</Link>
      </div>
    </div>
  );
}

export default Login;
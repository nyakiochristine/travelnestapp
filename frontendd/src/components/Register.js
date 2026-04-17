import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // import useNavigate
import './Register.css';

function Register() {
  const [name, setName] = useState('');  // changed from username to name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();  // initialize navigate

  const handleSubmit = async e => {
    e.preventDefault();
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }), // send name, email, password
    });
    if (response.ok) {
      alert('Registration successful');
      navigate('/login');  // redirect to login page after success
    } else {
      alert('Registration failed');
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
        <button type="submit" className="btn-register">Register</button>
      </form>
    </div>
  );
}

export default Register;

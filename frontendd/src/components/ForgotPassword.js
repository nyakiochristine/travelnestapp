import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(window.__TRAVELNEST_API_URL__ + '/api/auth/forgot-password', {
        email
      });

      if (res.data.resetToken) return navigate(`/reset-password/${res.data.resetToken}`);
      setMessage(res.data.message || 'Check your email');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '50px auto' }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: 10, marginBottom: 12 }}
        />
        <button type="submit" style={{ width: '100%', padding: 10 }}>
          Continue
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}
    </div>
  );
}

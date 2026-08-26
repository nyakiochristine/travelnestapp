import { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/api/auth/forgot-password', {
        email
      });

      setMessage(res.data.message || 'Check your email');
      if (res.data.resetLink) {
        setResetLink(res.data.resetLink);
      }
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
          Send Reset Link
        </button>
      </form>

      {message && <p style={{ marginTop: 15 }}>{message}</p>}

      {resetLink && (
        <div style={{ marginTop: 15 }}>
          <p>Development-only reset link:</p>
          <a href={resetLink}>{resetLink}</a>
        </div>
      )}
    </div>
  );
}

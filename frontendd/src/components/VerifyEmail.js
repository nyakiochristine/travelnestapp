import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email…');
  useEffect(() => {
    fetch(`http://localhost:3001/api/auth/verify-email/${token}`)
      .then(async response => setMessage((await response.json()).message || (response.ok ? 'Email verified.' : 'Verification failed.')))
      .catch(() => setMessage('Could not connect to the server.'));
  }, [token]);
  return <div className="login-container"><div className="login-form"><h2>TravelNest</h2><p>{message}</p><Link to="/login">Go to login</Link></div></div>;
}

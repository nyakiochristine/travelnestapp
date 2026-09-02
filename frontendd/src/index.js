import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Configure the API once so local development and deployed builds use the same code.
window.__TRAVELNEST_API_URL__ = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

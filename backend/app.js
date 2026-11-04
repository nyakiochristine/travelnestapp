const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const attractionRoutes = require('./routes/attraction');
const usersRoutes = require('./routes/users');
const smartPlannerRoute = require('./routes/SmartPlannerRoute');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

const productionSecurityHeaders = (_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
};

function createApp() {
  const app = express();
  const uploadsDir = path.join(__dirname, 'uploads');
  fs.mkdirSync(path.join(uploadsDir, 'profiles'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'messages'), { recursive: true });

  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.disable('x-powered-by');
  app.use(productionSecurityHeaders);
  app.use((req, res, next) => {
    res.set('X-Request-Id', req.headers['x-request-id'] || crypto.randomUUID());
    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(uploadsDir, { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0 }));

  app.get('/', (_req, res) => res.json({ status: 'ok', service: 'travelnest-api' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/itineraries', itineraryRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/attractions', attractionRoutes);
  app.use('/api/smart-planner', smartPlannerRoute);
  app.use('/api/notifications', notificationRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Attachments must be 25 MB or smaller.' });
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Only image and video attachments are supported.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must be valid JSON.' });
    if (error.message === 'Origin is not allowed by CORS') return res.status(403).json({ error: error.message });
    console.error('Unhandled request error:', error.message);
    return res.status(error.status || 500).json({ error: 'An unexpected error occurred.' });
  });

  return app;
}

if (require.main === module) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing. Set a long, random value in your environment.');
  connectDB().then(() => {
    const port = process.env.PORT || 3001;
    createApp().listen(port, () => console.log(`Server running on port ${port}`));
  });
}

module.exports = { createApp };

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Itinerary = require('../models/Itinerary');
const { verifyToken } = require('../middleware/authMiddleware');

// --- MULTER SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// --- HELPERS (Critical for PDF data structure) ---
const normalizePlaces = (places) => {
  return places.map(place => ({
    name: place.name || '',
    date: place.date || null,
    notes: place.notes || '',
    links: Array.isArray(place.links) ? place.links : [],
    images: Array.isArray(place.images) ? place.images : [],
    activities: Array.isArray(place.activities)
      ? place.activities
          .filter(act => act && typeof act === 'object' && act.name && act.name.trim())
          .map(act => ({
            name: act.name.trim(),
            cost: act.cost || '',
            currency: act.currency || 'USD',
            images: Array.isArray(act.images) ? act.images : []
          }))
      : []
  }));
};

// --- GET ROUTES ---

// 1. DASHBOARD: Only YOUR journeys
router.get('/my-itineraries', verifyToken, async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.userId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal journeys' });
  }
});

// 2. ITINERARIES TAB: The Social Media Feed (Unfiltered)
router.get('/', verifyToken, async (req, res) => {
  try {
    const itineraries = await Itinerary.find()
      .populate('user', 'name profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ACTION ROUTES ---

// 3. CREATE TRIP (Handles uploads for PDF/UI)
router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const { title, description, startDate, endDate, budget, currency, isAiGenerated } = req.body;
    let places = [];
    if (req.body.places) {
      places = typeof req.body.places === 'string' ? JSON.parse(req.body.places) : req.body.places;
    }

    const itinerary = new Itinerary({
      user: req.userId,
      title,
      description,
      startDate,
      endDate,
      budget,
      currency,
      isAiGenerated: isAiGenerated === 'true' || isAiGenerated === true
    });

    // File processing for images
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const publicPath = `/uploads/${file.filename}`;
        const fieldname = file.fieldname;
        if (fieldname === 'tripCoverImage') {
          itinerary.tripCoverImage = publicPath;
        } else if (fieldname.startsWith('placeImages-')) {
          const idx = parseInt(fieldname.split('-')[1], 10);
          if (places[idx]) {
            places[idx].images = places[idx].images || [];
            places[idx].images.push(publicPath);
          }
        }
      });
    }

    itinerary.places = normalizePlaces(places);
    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (err) {
    console.error('Creation error:', err);
    res.status(500).json({ error: 'Failed to create' });
  }
});

// 4. ADD COMMENT
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ error: 'Not found' });

    itinerary.comments.push({ user: req.userId, text });
    await itinerary.save();

    const populated = await Itinerary.findById(itinerary._id)
      .populate('user', 'name profilePicture')
      .populate('comments.user', 'name profilePicture');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. UPDATE ROUTE (Needed if editing)
router.put('/:id', verifyToken, upload.any(), async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ error: 'Not found' });
    if (itinerary.user.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, startDate, endDate, budget, currency } = req.body;
    itinerary.title = title || itinerary.title;
    itinerary.description = description || itinerary.description;
    
    // Logic for updating places would go here similarly to POST
    await itinerary.save();
    res.json(itinerary);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. DELETE ROUTE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary || itinerary.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Itinerary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
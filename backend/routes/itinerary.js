const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Itinerary = require('../models/Itinerary');
const { verifyToken } = require('../middleware/authMiddleware');

// --- MULTER SETUP (Preserved) ---
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

// --- HELPERS (Preserved for PDF Data Integrity) ---
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

// 1. DASHBOARD VIEW: Your private journeys
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

// 2. SOCIAL FEED (Itineraries Tab): Full Global Feed for Download
router.get('/', verifyToken, async (req, res) => {
  try {
    // find() is empty to pull EVERYTHING for the feed
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

// 3. CREATE TRIP (Handles all image uploads for the PDF)
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
      isAiGenerated: isAiGenerated === 'true' || isAiGenerated === true,
      places: normalizePlaces(places)
    });

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const publicPath = `/uploads/${file.filename}`;
        const fieldname = file.fieldname;

        if (fieldname === 'tripCoverImage') {
          itinerary.tripCoverImage = publicPath;
        } else if (fieldname.startsWith('placeImages-')) {
          const idx = parseInt(fieldname.split('-')[1], 10);
          if (itinerary.places[idx]) {
            itinerary.places[idx].images.push(publicPath);
          }
        }
      });
    }

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

// 5. DELETE TRIP
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ error: 'Not found' });

    if (itinerary.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Itinerary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
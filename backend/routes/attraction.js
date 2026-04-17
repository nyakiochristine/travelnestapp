
const express = require('express');
const router = express.Router();
const Attraction = require('../models/Attraction');
const { verifyToken } = require('../middleware/authMiddleware');

// POST Add a new attraction to the database
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { name, location, lat, lng, category, clusterId } = req.body;

    const newAttraction = new Attraction({
      name,
      location,
      lat,
      lng,
      category,
      clusterId 
    });

    await newAttraction.save();
    res.status(201).json({ message: "Attraction added successfully!", attraction: newAttraction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch all attractions for your dropdowns
router.get('/', async (req, res) => {
    try {
        const attractions = await Attraction.find();
        res.json(attractions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
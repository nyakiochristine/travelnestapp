const express = require('express');
const Attraction = require('../models/Attraction');
const Itinerary = require('../models/Itinerary');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const categoryMatches = (attraction, interests) => !interests.length || interests.some(interest => attraction.category?.toLowerCase().includes(interest.toLowerCase()));
const distance = (a, b) => {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat), dLng = radians(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { title, baseAttractionId, days = 3, interests = [], pace = 'balanced', budget = '' } = req.body;
    const safeInterests = Array.isArray(interests) ? interests.filter(value => typeof value === 'string') : [];
    const tripDays = Math.min(Math.max(Number(days) || 3, 1), 14);
    const base = await Attraction.findById(baseAttractionId);
    if (!base) return res.status(404).json({ error: 'Choose a valid starting landmark.' });
    const attractions = await Attraction.find();
    const matches = attractions
      .filter(item => item._id.toString() !== base._id.toString() && categoryMatches(item, safeInterests))
      .map(item => ({ ...item.toObject(), distanceKm: distance(base, item) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const stopsPerDay = pace === 'relaxed' ? 2 : pace === 'packed' ? 4 : 3;
    const selected = [base.toObject(), ...matches.slice(0, Math.max(tripDays * stopsPerDay - 1, 0))];
    const places = selected.map((item, index) => ({
      name: item.name, linkedAttraction: item._id,
      notes: index === 0 ? `Start your trip in ${item.location}. This is your base for nearby discoveries.` : `Suggested because it matches your interests and is about ${Math.round(item.distanceKm)} km from your starting point.`,
      activities: []
    }));
    const smartPlan = await Itinerary.create({
      title: title?.trim() || `Discover ${base.location}`,
      user: req.userId, places, budget, isAiGenerated: true, isPublic: false
    });
    const dailyPlan = Array.from({ length: tripDays }, (_, index) => ({
      day: index + 1,
      theme: index === 0 ? `Arrive and explore ${base.location}` : 'Local discoveries',
      stops: selected.slice(index * stopsPerDay, (index + 1) * stopsPerDay).map(stop => stop.name),
      rationale: pace === 'relaxed' ? 'Kept intentionally light so you have time to linger.' : 'Stops are grouped by proximity to reduce travel time.'
    })).filter(day => day.stops.length);
    res.status(201).json({ itinerary: await Itinerary.findById(smartPlan._id).populate('places.linkedAttraction'), dailyPlan, summary: { days: tripDays, pace, interestMatch: safeInterests.length ? safeInterests.join(', ') : 'a balanced mix of local highlights' } });
  } catch (error) { res.status(500).json({ error: 'Could not generate your itinerary.' }); }
});
module.exports = router;

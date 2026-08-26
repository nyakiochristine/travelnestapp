const express = require('express');
const Attraction = require('../models/Attraction');
const Itinerary = require('../models/Itinerary');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const maxDistanceForPace = { relaxed: 70, balanced: 100, packed: 125 };
const landmarkKey = name => name.toLowerCase().replace(/national park|conservancy/g, '').replace(/[^a-z0-9]/g, '');
const regionByLocation = {
  Coast: ['mombasa', 'kwale', 'watamu', 'malindi', 'kilifi', 'lamu', 'bamburi', 'diani'],
  Nairobi: ['nairobi', 'ngong'],
  'Rift Valley': ['nakuru', 'naivasha', 'narok', 'elementaita', 'rift valley'],
  Central: ['laikipia', 'nanyuki', 'nyeri', 'nyandarua', 'meru'],
  Western: ['kisumu', 'kakamega', 'busia', 'rusinga', 'siaya'],
  'Southern Safari': ['kajiado', 'amboseli', 'tsavo', 'taita']
};
const inferredRegion = place => place.region || Object.entries(regionByLocation).find(([, locations]) => locations.some(location => place.location?.toLowerCase().includes(location)))?.[0] || '';
const regionFromTripName = title => {
  const name = title?.toLowerCase() || '';
  if (name.includes('coast') || name.includes('coastal')) return 'Coast';
  if (name.includes('nairobi')) return 'Nairobi';
  if (name.includes('rift') || name.includes('nakuru') || name.includes('naivasha')) return 'Rift Valley';
  if (name.includes('western') || name.includes('kisumu')) return 'Western';
  if (name.includes('central') || name.includes('laikipia')) return 'Central';
  if (name.includes('safari') || name.includes('amboseli') || name.includes('tsavo')) return 'Southern Safari';
  return '';
};
const categoryMatches = (attraction, interests) => !interests.length || interests.some(interest => attraction.category?.toLowerCase().includes(interest.toLowerCase()));
const distance = (a, b) => {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat), dLng = radians(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { title, baseAttractionId, days = 3, interests = [], pace = 'balanced', budget = '', region = '' } = req.body;
    const safeInterests = Array.isArray(interests) ? interests.filter(value => typeof value === 'string') : [];
    const tripDays = Math.min(Math.max(Number(days) || 3, 1), 14);
    const base = await Attraction.findById(baseAttractionId);
    if (!base) return res.status(404).json({ error: 'Choose a valid starting landmark.' });
    const attractions = await Attraction.find({ $or: [{ status: 'approved' }, { status: { $exists: false } }] });
    const maxDistanceKm = maxDistanceForPace[pace] || maxDistanceForPace.balanced;
    const baseRegion = inferredRegion(base);
    const namedRegion = regionFromTripName(title);
    // The selected starting place is authoritative; a title only helps when it agrees with (or fills in) that location.
    const tripRegion = region || (namedRegion && (!baseRegion || namedRegion === baseRegion) ? namedRegion : baseRegion);
    const nearbyAttractions = attractions
      .filter(item => item._id.toString() !== base._id.toString())
      .filter(item => !tripRegion || inferredRegion(item) === tripRegion)
      .map(item => ({ ...item.toObject(), distanceKm: distance(base, item) }))
      .filter(item => item.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const interestMatches = nearbyAttractions.filter(item => categoryMatches(item, safeInterests));
    // A traveller's selected interests guide the route, but never justify an unrealistic cross-country jump.
    const usedInterestFallback = safeInterests.length > 0 && interestMatches.length === 0;
    const matches = interestMatches.length ? interestMatches : nearbyAttractions;
    const stopsPerDay = pace === 'relaxed' ? 2 : pace === 'packed' ? 4 : 3;
    const uniqueMatches = matches.filter((item, index, list) => list.findIndex(candidate => landmarkKey(candidate.name) === landmarkKey(item.name)) === index);
    const selected = [base.toObject()];
    const remaining = uniqueMatches.slice();
    while (remaining.length && selected.length < tripDays * stopsPerDay) {
      const lastStop = selected.at(-1);
      const nearestIndex = remaining.reduce((best, item, index) => distance(lastStop, item) < distance(lastStop, remaining[best]) ? index : best, 0);
      selected.push(remaining.splice(nearestIndex, 1)[0]);
    }
    const places = selected.map((item, index) => ({
      name: item.name, linkedAttraction: item._id,
      notes: index === 0 ? `Start your trip in ${item.location}. This is your base for nearby discoveries.` : `Suggested because it matches your interests and is about ${Math.round(item.distanceKm)} km from your starting point.`,
      activities: []
    }));
    const smartPlan = await Itinerary.create({
      title: title?.trim() || `Discover ${base.location}`,
      user: req.userId, places, budget, isAiGenerated: true, isPublic: false
    });
    const dailyPlan = Array.from({ length: tripDays }, (_, index) => {
      const stops = selected.slice(index * stopsPerDay, (index + 1) * stopsPerDay).map(stop => stop.name);
      return {
        day: index + 1,
        theme: index === 0 ? `Arrive and explore ${base.location}` : 'Local discoveries',
        stops,
        rationale: stops.length === 1 ? 'No suitable nearby stops were found in the current directory, so this day stays intentionally open.' : pace === 'relaxed' ? 'Kept intentionally light so you have time to linger.' : `Stops are ordered to minimise backtracking and stay within ${maxDistanceKm} km of your starting area.`
      };
    }).filter(day => day.stops.length);
    res.status(201).json({ itinerary: await Itinerary.findById(smartPlan._id).populate('places.linkedAttraction'), dailyPlan, summary: { days: tripDays, pace, region: tripRegion || 'your starting area', interestMatch: safeInterests.length ? safeInterests.join(', ') : 'a balanced mix of local highlights', nearbyStops: uniqueMatches.length, distanceLimitKm: maxDistanceKm, usedInterestFallback } });
  } catch (error) { res.status(500).json({ error: 'Could not generate your itinerary.' }); }
});
module.exports = router;

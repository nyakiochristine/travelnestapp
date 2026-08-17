const express = require('express');
const multer = require('multer');
const path = require('path');
const Itinerary = require('../models/Itinerary');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage });

function normalizePlaces(places = []) {
  return places.filter(Boolean).map(place => ({
    name: place.name || '',
    date: place.date || null,
    notes: place.notes || '',
    links: Array.isArray(place.links) ? place.links.filter(Boolean) : [],
    images: Array.isArray(place.images) ? place.images.filter(Boolean) : [],
    activities: Array.isArray(place.activities)
      ? place.activities.filter(activity => activity?.name?.trim()).map(activity => ({
          name: activity.name.trim(),
          cost: activity.cost || '',
          currency: activity.currency || 'USD',
          images: Array.isArray(activity.images) ? activity.images.filter(Boolean) : []
        }))
      : []
  }));
}

function requestPlaces(req) {
  if (!req.body.places) return [];
  return normalizePlaces(typeof req.body.places === 'string' ? JSON.parse(req.body.places) : req.body.places);
}

function addUploadedFiles(itinerary, files) {
  for (const file of files || []) {
    const imagePath = `/uploads/${file.filename}`;
    if (file.fieldname === 'tripCoverImage') itinerary.tripCoverImage = imagePath;
    const placeMatch = file.fieldname.match(/^placeImages-(\d+)$/);
    const activityMatch = file.fieldname.match(/^activityImages-(\d+)-(\d+)$/);
    if (placeMatch && itinerary.places[placeMatch[1]]) {
      itinerary.places[placeMatch[1]].images.push(imagePath);
    } else if (activityMatch && itinerary.places[activityMatch[1]]?.activities[activityMatch[2]]) {
      itinerary.places[activityMatch[1]].activities[activityMatch[2]].images.push(imagePath);
    }
  }
}

const populated = query => query.populate('user', 'name profilePicture').populate('comments.user', 'name profilePicture');

router.get('/my-itineraries', verifyToken, async (req, res) => {
  try {
    res.json(await populated(Itinerary.find({ user: req.userId }).sort({ createdAt: -1 })));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch personal journeys' }); }
});

router.get('/public', async (_req, res) => {
  try {
    res.json(await populated(Itinerary.find({ isPublic: true }).sort({ createdAt: -1 })));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch public itineraries' }); }
});

router.get('/saved', verifyToken, async (req, res) => {
  try {
    res.json(await populated(Itinerary.find({ savedBy: req.userId }).sort({ createdAt: -1 })));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch saved itineraries' }); }
});

router.get('/', verifyToken, async (_req, res) => {
  try {
    res.json(await populated(Itinerary.find().sort({ createdAt: -1 })));
  } catch (error) { res.status(500).json({ error: 'Failed to fetch itineraries' }); }
});

router.post('/', verifyToken, upload.any(), async (req, res) => {
  try {
    const itinerary = new Itinerary({
      user: req.userId, title: req.body.title, description: req.body.description || '',
      tripStart: req.body.tripStart || req.body.startDate || null,
      tripEnd: req.body.tripEnd || req.body.endDate || null,
      budget: req.body.budget || '', currency: req.body.currency || 'USD',
      isAiGenerated: req.body.isAiGenerated === 'true' || req.body.isAiGenerated === true,
      isPublic: req.body.isPublic !== 'false', places: requestPlaces(req)
    });
    addUploadedFiles(itinerary, req.files);
    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (error) { res.status(400).json({ error: error.message || 'Failed to create itinerary' }); }
});

router.post('/:id/like', verifyToken, async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  const index = itinerary.likes.findIndex(id => id.toString() === req.userId);
  const liked = index === -1;
  if (liked) itinerary.likes.push(req.userId); else itinerary.likes.splice(index, 1);
  await itinerary.save();
  res.json({ liked, likes: itinerary.likes, likesCount: itinerary.likes.length });
});

router.post('/:id/save', verifyToken, async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  const index = itinerary.savedBy.findIndex(id => id.toString() === req.userId);
  const saved = index === -1;
  if (saved) itinerary.savedBy.push(req.userId); else itinerary.savedBy.splice(index, 1);
  await itinerary.save();
  res.json({ saved });
});

router.post('/:id/comments', verifyToken, async (req, res) => {
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ error: 'Comment text is required' });
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  itinerary.comments.push({ user: req.userId, text });
  await itinerary.save();
  await itinerary.populate('comments.user', 'name profilePicture');
  res.status(201).json(itinerary.comments.at(-1));
});

router.post('/:id/rate', verifyToken, async (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) return res.status(400).json({ error: 'Rating must be 1 to 5' });
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  const prior = itinerary.ratings.find(rating => rating.user.toString() === req.userId);
  if (prior) prior.value = value; else itinerary.ratings.push({ user: req.userId, value });
  await itinerary.save();
  const averageRating = itinerary.ratings.reduce((sum, rating) => sum + rating.value, 0) / itinerary.ratings.length;
  res.json({ averageRating, ratingsCount: itinerary.ratings.length });
});

router.get('/:id', verifyToken, async (req, res) => {
  const itinerary = await populated(Itinerary.findById(req.params.id));
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  res.json(itinerary);
});

router.put('/:id', verifyToken, upload.any(), async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) return res.status(404).json({ error: 'Not found' });
    if (itinerary.user.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    for (const field of ['title', 'description', 'budget', 'currency']) if (req.body[field] !== undefined) itinerary[field] = req.body[field];
    if (req.body.tripStart !== undefined) itinerary.tripStart = req.body.tripStart || null;
    if (req.body.tripEnd !== undefined) itinerary.tripEnd = req.body.tripEnd || null;
    if (req.body.places) itinerary.places = requestPlaces(req);
    addUploadedFiles(itinerary, req.files);
    await itinerary.save();
    res.json(itinerary);
  } catch (error) { res.status(400).json({ error: error.message || 'Failed to update itinerary' }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Not found' });
  if (itinerary.user.toString() !== req.userId) return res.status(403).json({ error: 'Forbidden' });
  await itinerary.deleteOne();
  res.json({ message: 'Deleted' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Attraction = require('../models/Attraction');
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddleware');

const listingFields = ['name', 'location', 'lat', 'lng', 'category', 'type', 'region', 'tags', 'description', 'priceRange', 'currency', 'estimatedDuration', 'openingHours', 'contactEmail', 'contactPhone', 'website', 'amenities'];
const approvedOrLegacy = { $or: [{ status: 'approved' }, { status: { $exists: false } }] };
const isAdmin = user => user?.role === 'admin';
const businessAccess = user => isAdmin(user) || (user?.role === 'business' && user.businessVerificationStatus === 'approved');
const cleanListing = body => Object.fromEntries(listingFields.filter(key => body[key] !== undefined).map(key => [key, ['amenities', 'tags'].includes(key) ? (Array.isArray(body[key]) ? body[key].filter(Boolean) : []) : body[key]]));
const currentUser = req => User.findById(req.userId).select('role businessVerificationStatus');

router.post('/business-application', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  if (user.role === 'admin' || user.businessVerificationStatus === 'approved') return res.json({ message: 'Your business access is already approved.', status: 'approved' });
  user.role = 'business'; user.businessVerificationStatus = 'pending'; await user.save();
  res.status(202).json({ message: 'Business access requested. An admin must approve it before you can publish listings.', status: 'pending' });
});

router.get('/my', verifyToken, async (req, res) => {
  const user = await currentUser(req);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  const response = { role: user.role, verificationStatus: user.businessVerificationStatus, listings: await Attraction.find({ owner: req.userId }).sort({ updatedAt: -1 }) };
  if (isAdmin(user)) {
    response.pendingListings = await Attraction.find({ status: 'pending' }).populate('owner', 'name email').sort({ createdAt: 1 });
    response.businessApplications = await User.find({ role: 'business', businessVerificationStatus: 'pending' }).select('name email businessVerificationStatus createdAt');
  }
  res.json(response);
});

router.post('/add', verifyToken, async (req, res) => {
  try {
    const user = await currentUser(req);
    if (!businessAccess(user)) return res.status(403).json({ error: 'Approved business access is required to create a listing.' });
    const listing = cleanListing(req.body);
    if (!listing.name?.trim() || !listing.location?.trim() || !Number.isFinite(Number(listing.lat)) || !Number.isFinite(Number(listing.lng))) return res.status(400).json({ error: 'Name, location, latitude and longitude are required.' });
    const attraction = await Attraction.create({ ...listing, lat: Number(listing.lat), lng: Number(listing.lng), owner: req.userId, status: isAdmin(user) ? 'approved' : 'pending' });
    res.status(201).json({ message: isAdmin(user) ? 'Listing published.' : 'Listing submitted for approval.', attraction });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const attraction = await Attraction.findById(req.params.id); const user = await currentUser(req);
  if (!attraction) return res.status(404).json({ error: 'Listing not found.' });
  if (!isAdmin(user) && attraction.owner?.toString() !== req.userId) return res.status(403).json({ error: 'You can only edit your own listing.' });
  Object.assign(attraction, cleanListing(req.body));
  if (!isAdmin(user) && attraction.status === 'approved') attraction.status = 'pending';
  await attraction.save(); res.json({ message: 'Listing updated.', attraction });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const attraction = await Attraction.findById(req.params.id); const user = await currentUser(req);
  if (!attraction) return res.status(404).json({ error: 'Listing not found.' });
  if (!isAdmin(user) && attraction.owner?.toString() !== req.userId) return res.status(403).json({ error: 'You can only delete your own listing.' });
  await attraction.deleteOne(); res.json({ message: 'Listing deleted.' });
});

router.get('/pending', verifyToken, async (req, res) => {
  if (!isAdmin(await currentUser(req))) return res.status(403).json({ error: 'Admin access required.' });
  res.json(await Attraction.find({ status: 'pending' }).populate('owner', 'name email').sort({ createdAt: 1 }));
});

router.get('/business-applications', verifyToken, async (req, res) => {
  if (!isAdmin(await currentUser(req))) return res.status(403).json({ error: 'Admin access required.' });
  res.json(await User.find({ role: 'business', businessVerificationStatus: 'pending' }).select('name email businessVerificationStatus createdAt'));
});

router.patch('/business-applications/:userId', verifyToken, async (req, res) => {
  if (!isAdmin(await currentUser(req))) return res.status(403).json({ error: 'Admin access required.' });
  if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Choose approved or rejected.' });
  const user = await User.findOneAndUpdate({ _id: req.params.userId, role: 'business' }, { businessVerificationStatus: req.body.status }, { new: true });
  if (!user) return res.status(404).json({ error: 'Business application not found.' });
  res.json({ name: user.name, status: user.businessVerificationStatus });
});

router.patch('/:id/status', verifyToken, async (req, res) => {
  if (!isAdmin(await currentUser(req))) return res.status(403).json({ error: 'Admin access required.' });
  if (!['approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'Choose approved or rejected.' });
  const attraction = await Attraction.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!attraction) return res.status(404).json({ error: 'Listing not found.' });
  res.json(attraction);
});

router.get('/', async (_req, res) => {
  try { res.json(await Attraction.find(approvedOrLegacy)); } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

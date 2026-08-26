// routes/users.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/authMiddleware');

// Multer for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profiles/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

/* ---------- Get all users (list profiles) ---------- */
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');

    res.json(users);
  } catch (err) {
    console.error('💥 GET /users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Get current logged-in user info (/me) ---------- */
router.get('/me', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Fetching current user:', req.userId);

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ error: 'Invalid user ID in token' });
    }

    const user = await User.findById(req.userId)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');

    if (!user) {
      console.log('❌ Current user not found:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('💥 GET /users/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Get single user by id (profile detail) ---------- */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Fetching user ID:', req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ Invalid ObjectId:', req.params.id);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');

    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.name);
    res.json(user);
  } catch (err) {
    console.error('💥 GET /users/:id ERROR:', err.message);
    console.error('Full error stack:', err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Get user stats (itinerary count) ---------- */
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const count = await Itinerary.countDocuments({ user: req.params.id });

    res.json({
      itineraryCount: count
    });
  } catch (err) {
    console.error('💥 User stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Update current user profile ---------- */
router.put('/', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('🔍 Updating user:', req.userId);

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ error: 'Invalid user ID in token' });
    }

    const updates = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      console.log('❌ User not found for update:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = updates.name || user.name;
    user.bio = updates.bio || user.bio;
    user.location = updates.location || user.location;
    user.website = updates.website || user.website;
    user.instagram = updates.instagram || user.instagram;
    user.twitter = updates.twitter || user.twitter;
    user.facebook = updates.facebook || user.facebook;

    if (req.file) {
      console.log('📸 New profile picture:', req.file.filename);
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();
    const updatedUser = await User.findById(req.userId).select('-password');
    console.log('✅ Profile updated:', updatedUser.name);
    res.json(updatedUser);
  } catch (err) {
    console.error('💥 PUT /users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Follow a user ---------- */
router.post('/:id/follow', verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId?.toString();

    console.log('🔍 Follow request:', targetId, 'by:', currentId);

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid target user ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(currentId)) {
      return res.status(400).json({ error: 'Invalid current user ID' });
    }
    if (targetId === currentId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentId);

    if (!targetUser || !currentUser) {
      console.log('❌ Follow users not found:', targetId, currentId);
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadyFollowing = targetUser.followers
      .some(id => id.toString() === currentId);

    if (!alreadyFollowing) {
      await User.updateOne(
        { _id: targetId },
        { $addToSet: { followers: currentId } }
      );
      await User.updateOne(
        { _id: currentId },
        { $addToSet: { following: targetId } }
      );
      await Notification.create({ recipient: targetId, actor: currentId, type: 'follow' });
    }

    const updatedTarget = await User.findById(targetId)
      .select('followers following');

    res.json({
      followersCount: updatedTarget.followers.length,
      followingCount: updatedTarget.following.length,
      following: true
    });
  } catch (err) {
    console.error('💥 POST /users/:id/follow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- Unfollow a user ---------- */
router.post('/:id/unfollow', verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId?.toString();

    console.log('🔍 Unfollow request:', targetId, 'by:', currentId);

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid target user ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(currentId)) {
      return res.status(400).json({ error: 'Invalid current user ID' });
    }
    if (targetId === currentId) {
      return res.status(400).json({ error: 'You cannot unfollow yourself' });
    }

    const targetUser = await User.findById(targetId);
    const currentUser = await User.findById(currentId);

    if (!targetUser || !currentUser) {
      console.log('❌ Unfollow users not found:', targetId, currentId);
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = targetUser.followers
      .some(id => id.toString() === currentId);

    if (isFollowing) {
      await User.updateOne(
        { _id: targetId },
        { $pull: { followers: currentId } }
      );
      await User.updateOne(
        { _id: currentId },
        { $pull: { following: targetId } }
      );
    }

    const updatedTarget = await User.findById(targetId)
      .select('followers following');

    res.json({
      followersCount: updatedTarget.followers.length,
      followingCount: updatedTarget.following.length,
      following: false
    });
  } catch (err) {
    console.error('💥 POST /users/:id/unfollow error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

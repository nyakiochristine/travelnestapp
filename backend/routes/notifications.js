const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.userId }).populate('actor', 'name').populate('itinerary', 'title').sort({ createdAt: -1 }).limit(30);
  res.json(notifications);
});
router.post('/read-all', verifyToken, async (req, res) => {
  await Notification.updateMany({ recipient: req.userId, read: false }, { read: true });
  res.json({ message: 'Notifications marked as read.' });
});
module.exports = router;

// routes/chat.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');  // ✅ singular
const Message = require('../models/Message');
const User = require('../models/User');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'messages');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage });

function buildMessagePayload({ text, itineraryId, imageUrl }) {
  const normalizedText = typeof text === 'string' ? text.trim() : '';
  const normalizedImage = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  const normalizedItineraryId = itineraryId || null;

  if (!normalizedText && !normalizedImage && !normalizedItineraryId) {
    return {
      valid: false,
      error: 'Write a message or attach a picture before sending.'
    };
  }

  return {
    valid: true,
    text: normalizedText,
    image: normalizedImage || '',
    itineraryId: normalizedItineraryId
  };
}

/* 2.1 Create or get direct conversation between two users */
router.post('/direct/:otherUserId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId.toString();
    const otherId = req.params.otherUserId;

    if (!mongoose.Types.ObjectId.isValid(otherId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (userId === otherId) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }
    if (!await User.exists({ _id: otherId })) {
      return res.status(404).json({ error: 'Traveller not found' });
    }

    // Optional: only allow DMs to people you follow
    // const me = await User.findById(userId).select('following');
    // const isFollowing = me.following.some(id => id.toString() === otherId);
    // if (!isFollowing) {
    //   return res.status(403).json({ error: 'You can only message users you follow' });
    // }

    let convo = await Conversation.findOne({
      type: 'direct',
      members: { $all: [userId, otherId], $size: 2 }
    });

    if (!convo) {
      convo = await Conversation.create({
        type: 'direct',
        members: [userId, otherId],
        createdBy: userId
      });
    }

    await convo.populate('members', 'name profilePicture');
    res.json(convo);
  } catch (err) {
    console.error('direct convo error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.2 Create a group conversation */
router.post('/groups', verifyToken, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'Name and members required' });
    }

    const uniqueMembers = Array.from(
      new Set([...memberIds, req.userId.toString()])
    );

    const convo = await Conversation.create({
      type: 'group',
      name,
      description: description || '',
      members: uniqueMembers,
      createdBy: req.userId
    });

    res.status(201).json(convo);
  } catch (err) {
    console.error('create group error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.3 Get all conversations for logged-in user (sidebar list) */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const convos = await Conversation.find({
      members: { $in: [req.userId] }
    })
      .populate('members', 'name profilePicture')
      .sort({ updatedAt: -1 })
      .lean();

    const withLatestMessages = await Promise.all(convos.map(async convo => ({
      ...convo,
      latestMessage: await Message.findOne({ conversation: convo._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name')
        .populate('itinerary', 'title')
        .lean()
    })));

    res.json(withLatestMessages);
  } catch (err) {
    console.error('get my convos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.4 Send a message (text and/or itinerary) */
router.post('/:conversationId/messages', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { text, itineraryId } = req.body;
    const imageUrl = req.file ? `/uploads/messages/${req.file.filename}` : req.body.image;
    const convoId = req.params.conversationId;

    if (!mongoose.Types.ObjectId.isValid(convoId)) {
      return res.status(400).json({ error: 'Invalid conversation id' });
    }

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isMember = convo.members.some(
      m => m.toString() === req.userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }

    const payload = buildMessagePayload({
      text,
      itineraryId,
      imageUrl
    });

    if (!payload.valid) {
      return res.status(400).json({ error: payload.error });
    }

    const message = await Message.create({
      conversation: convoId,
      sender: req.userId,
      text: payload.text,
      image: payload.image,
      itinerary: payload.itineraryId || null
    });

    convo.updatedAt = new Date();
    await convo.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('itinerary', 'title tripCoverImage');

    res.status(201).json(populated || message);
  } catch (err) {
    console.error('send message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.5 Get messages in a conversation */
router.get('/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const convoId = req.params.conversationId;
    if (!mongoose.Types.ObjectId.isValid(convoId)) {
      return res.status(400).json({ error: 'Invalid conversation id' });
    }

    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    const isMember = convo.members.some(
      m => m.toString() === req.userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this conversation' });
    }

    const messages = await Message.find({ conversation: convoId })
      .populate('sender', 'name profilePicture')
      .populate('itinerary', 'title tripCoverImage')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('get messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.6 Share an itinerary to multiple users (creates messages) */
router.post('/share-itinerary', verifyToken, async (req, res) => {
  try {
    const { targetUserIds, itineraryId, text } = req.body;
    if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
      return res.status(400).json({ error: 'targetUserIds is required' });
    }
    if (!itineraryId) {
      return res.status(400).json({ error: 'itineraryId is required' });
    }

    const senderId = req.userId.toString();
    const uniqueTargets = Array.from(new Set(targetUserIds));

    const results = [];

    for (const otherId of uniqueTargets) {
      if (!mongoose.Types.ObjectId.isValid(otherId) || otherId === senderId) {
        continue;
      }

      // Optional follow restriction here if you want

      let convo = await Conversation.findOne({
        type: 'direct',
        members: { $all: [senderId, otherId], $size: 2 }
      });

      if (!convo) {
        convo = await Conversation.create({
          type: 'direct',
          members: [senderId, otherId],
          createdBy: senderId
        });
      }

      const message = await Message.create({
        conversation: convo._id,
        sender: senderId,
        text: text || '',
        itinerary: itineraryId
      });

      convo.updatedAt = new Date();
      await convo.save();

      results.push({ conversationId: convo._id, messageId: message._id });
    }

    res.status(201).json({ shared: results });
  } catch (err) {
    console.error('share-itinerary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
module.exports.buildMessagePayload = buildMessagePayload;

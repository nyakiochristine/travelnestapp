// routes/chat.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/authMiddleware');
const Conversation = require('../models/Conversation');  // ✅ singular
const Message = require('../models/Message');
// const User = require('../models/User'); // only needed if you enforce follow check

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
      .sort({ updatedAt: -1 });

    res.json(convos);
  } catch (err) {
    console.error('get my convos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* 2.4 Send a message (text and/or itinerary) */
router.post('/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { text, itineraryId } = req.body;
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

    const message = await Message.create({
      conversation: convoId,
      sender: req.userId,
      text: text || '',
      itinerary: itineraryId || null
    });

    convo.updatedAt = new Date();
    await convo.save();

    // For newer Mongoose you can repopulate like this:
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

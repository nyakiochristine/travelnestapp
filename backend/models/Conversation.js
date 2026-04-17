// models/Conversation.js
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    // "direct" or "group"
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },

    // All members in this conversation
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    ],

    // For groups only
    name: { type: String },
    description: { type: String },
    // Optional group image later
    coverImage: { type: String },

    // Who created the group
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);

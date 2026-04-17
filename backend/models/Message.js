// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      default: ''
    },

    // Optional: share an itinerary inside a message
    itinerary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      default: null
    },

    // delivery / read status
    status: {
      type: String,
      enum: ['sent', 'seen'],
      default: 'sent'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Message', MessageSchema);

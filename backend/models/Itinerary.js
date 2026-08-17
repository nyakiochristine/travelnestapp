const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cost: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  images: { type: [String], default: [] }
}, { _id: false });

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, default: null },
  notes: { type: String, default: '' },
  links: { type: [String], default: [] },
  images: { type: [String], default: [] },
  activities: { type: [activitySchema], default: [] },
  linkedAttraction: { type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 }
}, { _id: false });

const itinerarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tripStart: { type: Date, default: null },
  tripEnd: { type: Date, default: null },
  budget: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  tripCoverImage: { type: String, default: '' },
  places: { type: [placeSchema], default: [] },
  isAiGenerated: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  savedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  comments: { type: [commentSchema], default: [] },
  ratings: { type: [ratingSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Itinerary', itinerarySchema);

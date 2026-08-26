const mongoose = require('mongoose');

const placeSuggestionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  sourceItineraries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary' }],
  submittedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notes: { type: String, default: '' },
  links: [{ type: String }],
  activityNames: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('PlaceSuggestion', placeSuggestionSchema);

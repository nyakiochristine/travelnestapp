const mongoose = require('mongoose');

const AttractionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true }, 
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  category: { type: String }, 
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  priceRange: { type: String, default: '' },
  currency: { type: String, default: 'KES' },
  estimatedDuration: { type: String, default: '' },
  openingHours: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  website: { type: String, default: '' },
  amenities: [{ type: String }],
  
  
  // K-means engine stores the regional group number
  clusterId: { type: Number, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('Attraction', AttractionSchema);

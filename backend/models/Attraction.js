const mongoose = require('mongoose');

const AttractionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true }, 
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  category: { type: String }, 
  description: { type: String },
  
  
  // K-means engine stores the regional group number
  clusterId: { type: Number, default: null } 
});

module.exports = mongoose.model('Attraction', AttractionSchema);
require('dotenv').config(); 
const mongoose = require('mongoose');
const Attraction = require('./models/Attraction'); 

const attractions = [
  { name: "Maasai Mara", location: "Narok", lat: -1.5271, lng: 35.1920, category: "Wildlife" },
  { name: "Diani Beach", location: "Kwale", lat: -4.2798, lng: 39.5947, category: "Beach" },
  { name: "Fort Jesus", location: "Mombasa", lat: -4.0624, lng: 39.6794, category: "Historical" },
  { name: "Nairobi National Park", location: "Nairobi", lat: -1.3733, lng: 36.8589, category: "Wildlife" },
  { name: "Hell's Gate", location: "Naivasha", lat: -0.8871, lng: 36.3167, category: "Adventure" },
  { name: "Lake Nakuru", location: "Nakuru", lat: -0.3554, lng: 36.0948, category: "Wildlife" },
  { name: "Amboseli", location: "Kajiado", lat: -2.6527, lng: 37.2606, category: "Wildlife" }
];

const more_attractions = [
  // --- NAIROBI & CENTRAL HUB ---
  { name: "Ol Pejeta Conservancy", location: "Laikipia", lat: 0.0121, lng: 36.8115, category: "Wildlife" },
  { name: "Karura Forest", location: "Nairobi", lat: -1.2411, lng: 36.8258, category: "Adventure" },

  // --- COASTAL HUB ---
  { name: "Gede Ruins", location: "Watamu", lat: -3.3089, lng: 40.0189, category: "Historical" },
  { name: "Haller Park", location: "Bamburi", lat: -3.9961, lng: 39.7247, category: "Wildlife" },

  // --- RIFT VALLEY & WESTERN HUB ---
  { name: "Hell's Gate National Park", location: "Naivasha", lat: -0.8858, lng: 36.3167, category: "Adventure" },
  { name: "Mount Longonot", location: "Rift Valley", lat: -0.9144, lng: 36.4542, category: "Adventure" },
  { name: "Crying Stone of Ilesi", location: "Kakamega", lat: 0.2225, lng: 34.7758, category: "Cultural" },
  { name: "Kit Mikayi", location: "Kisumu", lat: -0.1172, lng: 34.5422, category: "Cultural" }
];

// FIX 1: Corrected the typo 'attractionsttractions' and combined unique entries
const allAttractions = [...attractions, ...more_attractions];

// FIX 2: Filter out duplicates if the same name exists in both lists
const uniqueAttractions = Array.from(new Map(allAttractions.map(item => [item['name'], item])).values());

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");
    
    // Clear existing to ensure a fresh K-means environment
    await Attraction.deleteMany({});
    
    // FIX 3: Actually insert the combined 'uniqueAttractions' list
    await Attraction.insertMany(uniqueAttractions);
    
    console.log(`Success! ${uniqueAttractions.length} Kenyan attractions seeded. 🌱`);
    process.exit(); 
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
};

seedDB();
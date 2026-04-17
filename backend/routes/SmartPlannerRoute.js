const express = require('express');
const router = express.Router();
const Attraction = require('../models/Attraction');
const Itinerary = require('../models/Itinerary'); 
const { verifyToken } = require('../middleware/authMiddleware');
const { generateClusteredItinerary } = require('../utils/ItineraryEngine');

router.post('/generate', verifyToken, async (req, res) => {
    try {
        const { title, baseAttractionId } = req.body;

        // 1. Refresh clusters
        await generateClusteredItinerary(4); 

        // 2. Find starting point
        const base = await Attraction.findById(baseAttractionId);
        if (!base) return res.status(404).json({ message: "Landmark not found" });

        // 3. Find geographical neighbors
        const neighbors = await Attraction.find({ 
            clusterId: base.clusterId,
            _id: { $ne: base._id } 
        });

        // 4. MAP TO YOUR MANUAL SCHEMA FORMAT
        // Instead of saving IDs, we save objects that match your PlaceSchema
        const allPlaces = [base, ...neighbors].map(attr => ({
            name: attr.name,
            linkedAttraction: attr._id, // This links it to the ML data
            notes: "Automatically suggested based on regional proximity.",
            activities: [] // Keeps your manual activity structure ready to use
        }));

        const smartPlan = new Itinerary({
            title: title || `Discovery: ${base.location} Region`,
            user: req.user?._id || req.user?.id || req.body.userId,
            places: allPlaces, // Now perfectly compatible with your model!
            isAiGenerated: true 
        });

        await smartPlan.save();
        
        // Populate the link if you want to pull extra data (like Lat/Lng) later
        const result = await Itinerary.findById(smartPlan._id).populate('places.linkedAttraction');
        
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
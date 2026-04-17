require('dotenv').config();
const mongoose = require('mongoose');
const Attraction = require('./models/Attraction');
const { kmeans } = require('ml-kmeans');

const runClustering = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Starting ML Clustering...");

    const attractions = await Attraction.find({});
    
    // Prepare the data (Latitude and Longitude only) for the ML model
    const data = attractions.map(a => [a.lat, a.lng]);

    // Run K-means: We want to find 4 distinct hubs in Kenya
    const clusters = kmeans(data, 4);

    // Update each document in MongoDB with its new Cluster ID
    const updatePromises = attractions.map((attraction, index) => {
      return Attraction.findByIdAndUpdate(attraction._id, {
        clusterId: clusters.clusters[index]
      });
    });

    await Promise.all(updatePromises);
    
    console.log(" Intelligence Added! All attractions now have a clusterId.");
    process.exit();
  } catch (err) {
    console.error("Clustering failed:", err);
    process.exit(1);
  }
};

runClustering();
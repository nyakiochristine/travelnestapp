const skmeans = require('skmeans');
const Attraction = require('../models/Attraction');

const generateClusteredItinerary = async (kCount = 4) => {
  // 1. Fetch all attractions
  const attractions = await Attraction.find({});
  
  if (attractions.length === 0) return [];

  // 2. Extract coordinates for ML processing
  const coords = attractions.map(a => [a.lat, a.lng]);
  
  // 3. Run K-means Clustering
  const res = skmeans(coords, kCount);
  
  // 4. Update the Database with the Cluster IDs
  // This is the missing piece that makes the AI Planner work!
  const updatePromises = attractions.map((attr, index) => {
    return Attraction.findByIdAndUpdate(attr._id, {
      clusterId: res.idxs[index]
    });
  });

  await Promise.all(updatePromises);
  console.log(`ML Engine: Successfully synchronized ${attractions.length} landmarks into ${kCount} clusters.`);

  // 5. Return the updated data
  const clusteredData = attractions.map((attr, index) => ({
    ...attr._doc,
    clusterId: res.idxs[index]
  }));

  return clusteredData;
};

module.exports = { generateClusteredItinerary };
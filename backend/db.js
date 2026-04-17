const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB at:', process.env.MONGO_URI); // Optional debug log
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB URI from env:', process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

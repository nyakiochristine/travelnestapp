const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const attractionRoutes = require('./routes/attraction');
const usersRoutes = require('./routes/users');
const smartPlannerRoute = require('./routes/SmartPlannerRoute');
const notificationRoutes = require('./routes/notifications');




const chatRoutes = require('./routes/chat');




const app = express();
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(path.join(uploadsDir, 'profiles'), { recursive: true });

// Enable cross-origin requests
app.use(cors());
app.use(express.json());

// Make 'uploads' folder publicly available for image display
app.use('/uploads', express.static(uploadsDir));

// Connect to DB only once here
connectDB();

app.get('/', (req, res) => res.send('API is running...'));

// Use routes (auth, itineraries)
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/attractions', attractionRoutes);



app.use('/api/smart-planner', smartPlannerRoute);
app.use('/api/notifications', notificationRoutes);



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const pollRoutes = require('./routes/pollRoutes');
const voteRoutes = require('./routes/voteRoutes');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// User Routes
app.use('/api/users', userRoutes);
// Add Poll Routes
app.use('/api/polls', pollRoutes);

app.use('/api/votes', voteRoutes);


// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

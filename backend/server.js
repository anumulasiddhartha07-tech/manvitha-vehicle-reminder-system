import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, seedDatabase } from './database.js';
import { startScheduler } from './scheduler.js';
import router from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend local development
app.use(cors({
  origin: '*', // Adjust this to specific origin if needed (e.g. localhost:5173)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Main Router Prefix
app.use('/api', router);

// Serve static mock assets or documentation at root
app.get('/', (req, res) => {
  res.send('Vehicle Insurance & Permit Renewal Management System API is running...');
});

// Database Sync and Server Listening
const startServer = async () => {
  try {
    // Sync Database
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    // Seed default data if needed
    await seedDatabase();

    // Start background alert monitoring
    startScheduler();

    // Bind Port
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();

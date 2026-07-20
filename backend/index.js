import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';

// Import all route files
import authRoutes      from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import feedbackRoutes  from './routes/feedbackRoutes.js';
import transcriptRoutes from './routes/transcriptRoutes.js';
import generateRoutes  from './routes/generateRoutes.js';

// Create the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────
// Allow requests from the frontend (with cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming cookies (used for session authentication)
app.use(cookieParser());

// Parse incoming JSON request bodies
app.use(express.json());

// ─── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/transcript',    transcriptRoutes);
app.use('/api/vapi/generate', generateRoutes);

// A simple health-check route to confirm the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start server ──────────────────────────────────────────────────
// First connect to MongoDB, then start listening for requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ VoxTutor backend running on http://localhost:${PORT}`);
  });
});

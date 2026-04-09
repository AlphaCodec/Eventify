import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import eventsRouter from './routes/events.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';

dotenv.config();

const app = express();

// Allow requests from the React dev server
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/events',   eventsRouter);
app.use('/api/auth',     authRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);

// Start
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Eventify backend running on http://localhost:${PORT}`);
  });
});

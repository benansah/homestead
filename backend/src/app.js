import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import hostelRoutes from './routes/hostels.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import roommateRoutes from './routes/roommateRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import savedSearchRoutes from './routes/savedSearchRoutes.js';
import residenceAreaRoutes from './routes/residenceAreas.js';
import { hostelSchema } from '../validators/hostelValidators.js';
import { validate } from './middleware/validate.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { processEmailQueue } from './services/emailWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : true,
  credentials: true,
}));
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('🏠 Hostel Finder API is running');
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/residence-areas', residenceAreaRoutes);

// Dev-only debug endpoints
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/_debug/validate-hostel', validate(hostelSchema), (req, res) => {
    res.json({ message: 'Validation passed', data: req.body });
  });
}

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  setInterval(processEmailQueue, 60_000);
});

export default app;
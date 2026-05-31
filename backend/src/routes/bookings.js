import express from 'express';
import {
  initiateBooking,
  verifyBookingPayment,
  releaseContact,
  processRefund,
  getMyBookings,
  getLandlordBookings,
  getAllBookings,
} from '../controllers/bookingController.js';
import {
  createGroupBooking,
  joinGroupBooking,
  getGroupBooking,
  getMyGroupBookings,
} from '../controllers/groupBookingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { bookingSchema, groupBookingSchema } from '../../validators/bookingValidators.js';

const router = express.Router();

// Payment verify (no auth — Paystack redirects here)
router.get('/verify/:reference', verifyBookingPayment);

// Student — solo bookings
router.post('/', authMiddleware, allowRoles('student'), validate(bookingSchema), initiateBooking);
router.get('/my-bookings', authMiddleware, allowRoles('student'), getMyBookings);

// Landlord — bookings for their rooms
router.get('/landlord', authMiddleware, allowRoles('landlord'), getLandlordBookings);

// Student — group bookings
router.post('/group', authMiddleware, allowRoles('student'), validate(groupBookingSchema), createGroupBooking);
router.get('/group/my', authMiddleware, allowRoles('student'), getMyGroupBookings);
router.get('/group/:id', authMiddleware, allowRoles('student'), getGroupBooking);
router.post('/group/:id/join', authMiddleware, allowRoles('student'), joinGroupBooking);

// Admin
router.get('/', authMiddleware, allowRoles('admin'), getAllBookings);
router.patch('/:id/release-contact', authMiddleware, allowRoles('admin'), releaseContact);
router.patch('/:id/refund', authMiddleware, allowRoles('admin'), processRefund);

export default router;
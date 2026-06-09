import express from 'express';
import {
  getRoomsByHostel,
  getRoomById,
  createRoom,
  createRoomsBulk,
  updateRoom,
  updateRoomAvailability,
  addRoomImage,
  setTourImage,
  deleteRoom,
  bulkUpdateAvailability,
} from '../controllers/roomController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { upload, uploadTour } from '../services/cloudinary.js';

const router = express.Router();

// ── Public ───────────────────────────────────────────────────
router.get('/:id',              getRoomById);
router.get('/:hostel_id/rooms', getRoomsByHostel);

// ── Landlord + admin ─────────────────────────────────────────
router.post('/:hostel_id/rooms',      authMiddleware, allowRoles('landlord', 'admin'), createRoom);
router.post('/:hostel_id/rooms/bulk', authMiddleware, allowRoles('landlord', 'admin'), createRoomsBulk);
router.patch('/:id',                  authMiddleware, allowRoles('landlord', 'admin'), updateRoom);
router.post('/:id/images',            authMiddleware, allowRoles('landlord', 'admin'), addRoomImage);
router.post('/:id/tour',              authMiddleware, allowRoles('landlord', 'admin'), uploadTour.single('tour'), setTourImage);

// ── Admin only ────────────────────────────────────────────────
router.patch('/rooms/:id/availability', authMiddleware, allowRoles('admin', 'landlord'), updateRoomAvailability);
router.delete('/rooms/:id',             authMiddleware, allowRoles('admin', 'landlord'),  deleteRoom);
router.patch('/bulk-availability',      authMiddleware, allowRoles('landlord', 'admin'), bulkUpdateAvailability);

export default router;

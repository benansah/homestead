import express from 'express';
import {
  getRoomsByHostel,
  createRoom,
  createRoomsBulk,
  updateRoomAvailability,
  deleteRoom,
} from '../controllers/roomController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';

const router = express.Router();

// Public
router.get('/:hostel_id/rooms', getRoomsByHostel);

// Landlord + admin
router.post('/:hostel_id/rooms', authMiddleware, allowRoles('landlord', 'admin'), createRoom);
router.post('/:hostel_id/rooms/bulk', authMiddleware, allowRoles('landlord', 'admin'), createRoomsBulk);

// Admin only
router.patch('/rooms/:id/availability', authMiddleware, allowRoles('admin', 'landlord'), updateRoomAvailability);
router.delete('/rooms/:id', authMiddleware, allowRoles('admin'), deleteRoom);

export default router;
import express from 'express';
import {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostel,
  updateHostelStatus,
  toggleVerified,
  deleteHostel,
  flagHostel,
  getFlaggedHostels,
  dismissFlags,
} from '../controllers/hostelController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { hostelSchema } from '../../validators/hostelValidators.js';

const router = express.Router();

// Public routes — no login needed
router.get('/', getAllHostels);

// Admin only — must be before /:id to prevent "flagged" being treated as a hostel id
router.get('/flagged', authMiddleware, allowRoles('admin'), getFlaggedHostels);

router.get('/:id', getHostelById);

// Landlord + admin — must be logged in
router.post('/', authMiddleware, allowRoles('landlord', 'admin'), validate(hostelSchema), createHostel);
router.put('/:id', authMiddleware, allowRoles('landlord', 'admin'), updateHostel);
router.delete('/:id', authMiddleware, allowRoles('landlord', 'admin'), deleteHostel);

// Authenticated users — flag a listing
router.post('/:id/flag', authMiddleware, flagHostel);

// Admin only
router.delete('/:id/flags', authMiddleware, allowRoles('admin'), dismissFlags);
router.patch('/:id/status', authMiddleware, allowRoles('admin'), updateHostelStatus);
router.patch('/:id/verify', authMiddleware, allowRoles('admin'), toggleVerified);

export default router;
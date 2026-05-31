import express from 'express';
import {
  getAllHostels,
  getHostelById,
  createHostel,
  updateHostelStatus,
  toggleVerified,
  deleteHostel,
} from '../controllers/hostelController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { hostelSchema } from '../../validators/hostelValidators.js';

const router = express.Router();

// Public routes — no login needed
router.get('/', getAllHostels);
router.get('/:id', getHostelById);

// Landlord + admin — must be logged in
router.post('/', authMiddleware, allowRoles('landlord', 'admin'),validate(hostelSchema), createHostel);

// Admin only
router.patch('/:id/status', authMiddleware, allowRoles('admin'), updateHostelStatus);
router.patch('/:id/verify', authMiddleware, allowRoles('admin'), toggleVerified);
router.delete('/:id', authMiddleware, allowRoles('admin'), deleteHostel);

export default router;
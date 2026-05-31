import express from 'express';
import { createReview, deleteReview } from '../controllers/reviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';

const router = express.Router();

router.post('/', authMiddleware, allowRoles('student'), createReview);
router.delete('/:id', authMiddleware, allowRoles('student', 'admin'), deleteReview);

export default router;
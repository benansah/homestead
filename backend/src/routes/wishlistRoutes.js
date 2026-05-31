import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',          authMiddleware, getWishlist);
router.post('/',         authMiddleware, addToWishlist);
router.delete('/:hostel_id', authMiddleware, removeFromWishlist);

export default router;
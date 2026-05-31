import express from 'express';
import {
  searchHostels,
  getNearbyHostels,
  compareHostels,
  matchHostels,
} from '../controllers/searchController.js';

const router = express.Router();

// All search routes are public — no login needed
router.get('/', searchHostels);
router.get('/nearby/:university', getNearbyHostels);
router.get('/compare', compareHostels);
router.get('/match', matchHostels);

export default router;
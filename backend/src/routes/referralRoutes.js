import express from 'express';
import { getMyReferrals, applyReferralCode } from '../controllers/referralController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',     authMiddleware, getMyReferrals);
router.post('/apply', authMiddleware, applyReferralCode);

export default router;
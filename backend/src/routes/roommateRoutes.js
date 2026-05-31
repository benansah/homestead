import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import {
  createOrUpdateProfile,
  getMyProfile,
  getMatches,
  sendRequest,
  getRequests,
  respondToRequest,
  deactivateProfile,
} from '../controllers/roommateController.js';

const router = Router();

// All roommate routes require authentication and student role
router.use(authMiddleware);
router.use(allowRoles('student'));

router.post('/profile', createOrUpdateProfile);
router.get('/profile', getMyProfile);
router.delete('/profile', deactivateProfile);

router.get('/matches', getMatches);

router.post('/request', sendRequest);
router.get('/requests', getRequests);
router.patch('/request/:id', respondToRequest);

export default router;

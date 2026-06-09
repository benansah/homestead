import express from 'express';
import {
  createSavedSearch,
  getMySavedSearches,
  deleteSavedSearch,
} from '../controllers/savedSearchController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';

const router = express.Router();

router.post('/', authMiddleware, allowRoles('student'), createSavedSearch);
router.get('/', authMiddleware, allowRoles('student'), getMySavedSearches);
router.delete('/:id', authMiddleware, allowRoles('student'), deleteSavedSearch);

export default router;

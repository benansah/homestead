import express from 'express';
import {
  getAllUniversities,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} from '../controllers/universityController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';

const router = express.Router();

router.get('/',    getAllUniversities);
router.post('/',   authMiddleware, allowRoles('admin'), createUniversity);
router.patch('/:id',  authMiddleware, allowRoles('admin'), updateUniversity);
router.delete('/:id', authMiddleware, allowRoles('admin'), deleteUniversity);

export default router;

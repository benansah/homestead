import express from 'express';
import {
  getResidenceAreas,
  createResidenceArea,
  updateResidenceArea,
  deleteResidenceArea,
} from '../controllers/residenceAreaController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';

const router = express.Router();

router.get('/', getResidenceAreas);
router.post('/', authMiddleware, allowRoles('admin'), createResidenceArea);
router.patch('/:id', authMiddleware, allowRoles('admin'), updateResidenceArea);
router.delete('/:id', authMiddleware, allowRoles('admin'), deleteResidenceArea);

export default router;

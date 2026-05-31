import express from 'express';
import { uploadRoomImages, deleteRoomImage } from '../controllers/uploadController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { upload } from '../services/cloudinary.js';

const router = express.Router();

router.post(
  '/rooms/:room_id',
  authMiddleware,
  allowRoles('landlord', 'admin'),
  upload.array('images', 6),
  uploadRoomImages
);

router.delete(
  '/:id',
  authMiddleware,
  allowRoles('landlord', 'admin'),
  deleteRoomImage
);

export default router;
import express from 'express';
import { registerUser, loginUser, getAllUsers, googleAuth, forgotPassword, resetPassword } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../../validators/authValidators.js';

const router = express.Router();

router.post('/register',        validate(registerSchema), registerUser);
router.post('/login',           validate(loginSchema),    loginUser);
router.post('/auth/google',     googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/',                 authMiddleware, allowRoles('admin'), getAllUsers);

export default router;
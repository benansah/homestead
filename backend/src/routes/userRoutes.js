import express from 'express';
import { registerUser, loginUser, getAllUsers, getMe, updateMe, googleAuth, forgotPassword, resetPassword, changeUserRole, deleteUser } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import allowRoles from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../../validators/authValidators.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register',        authLimiter, validate(registerSchema), registerUser);
router.post('/login',           authLimiter, validate(loginSchema),    loginUser);
router.post('/auth/google',     authLimiter, googleAuth);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);
router.get('/me',               authMiddleware, getMe);
router.patch('/me',             authMiddleware, updateMe);
router.get('/',                 authMiddleware, allowRoles('admin'), getAllUsers);
router.patch('/:id/role',       authMiddleware, allowRoles('admin'), changeUserRole);
router.delete('/:id',           authMiddleware, allowRoles('admin'), deleteUser);

export default router;
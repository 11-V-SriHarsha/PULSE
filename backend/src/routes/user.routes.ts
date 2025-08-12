import { Router } from 'express';
import { getMyProfile, updateProfile, deleteAccount } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// This route is protected by the authenticateToken middleware
router.get('/profile', authenticateToken, getMyProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.delete('/profile', authenticateToken, deleteAccount);

export default router;
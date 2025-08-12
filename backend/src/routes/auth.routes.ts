import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { login, register, logout, changePassword } from '../controllers/auth.controller.js'; // <-- Note the .js extension

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/change-password', authenticateToken, changePassword);

export default router;
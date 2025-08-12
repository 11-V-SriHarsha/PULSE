import { Router } from 'express';
import { fetchAndSaveTransactions } from '../controllers/aa.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// This endpoint simulates fetching data from the AA network for the logged-in user
router.get('/fetch', authenticateToken, fetchAndSaveTransactions);

export default router;
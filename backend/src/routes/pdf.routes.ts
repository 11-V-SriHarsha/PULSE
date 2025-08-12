import { Router } from 'express';
import multer from 'multer';
import { uploadPdfStatement } from '../controllers/pdf.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/upload', authenticateToken, upload.single('file'), uploadPdfStatement);

export default router;

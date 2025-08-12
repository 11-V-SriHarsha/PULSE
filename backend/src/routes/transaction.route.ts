import { Router } from 'express';
import multer from 'multer';
import { uploadTransactions, getTransactions, getTransactionSummary } from '../controllers/transaction.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Your new, more secure multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    // Allow only CSV files
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  }
});

router.get('/summary', authenticateToken, getTransactionSummary);
router.get('/', authenticateToken, getTransactions);
router.post('/upload', authenticateToken, upload.single('file'), uploadTransactions);

export default router;
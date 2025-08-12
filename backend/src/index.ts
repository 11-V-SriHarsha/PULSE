import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js'; // <-- Note the .js extension
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.route.js'; 
import aaRoutes from './routes/aa.routes.js';
import pdfRoutes from './routes/pdf.routes.js';

// Load environment variables
dotenv.config();

console.log("My JWT Secret on startup:", process.env.JWT_SECRET); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser()); 

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/aa', aaRoutes);
app.use('/api/pdf', pdfRoutes);

// app.get('/', (req: Request, res: Response) => {
//   res.send('Pulse Backend API');
// });

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
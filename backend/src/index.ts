import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import ticketRoutes from './routes/tickets';
import faqRoutes from './routes/faqs';
import chatbotRoutes from './routes/chatbot';
const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/ai/chatbot', chatbotRoutes);
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workaid')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

export default app; 
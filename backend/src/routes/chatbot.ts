import express from 'express';
import { handleChatbotQuestion, getChatHistory, updateChatFeedback } from '../controllers/chatbotController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Handle chatbot questions
router.post('/answer-bot', handleChatbotQuestion);

// Get chat history
router.get('/history', getChatHistory);

// Update chat feedback
router.put('/feedback/:chatId', updateChatFeedback);

export default router; 
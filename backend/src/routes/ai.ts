import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { auth } from '../middleware/auth';
import { suggestReply } from '../controllers/aiController';

const router = Router();

// All AI routes require authentication
router.use(auth);

// Generate AI response
router.post('/answer', aiController.generateAnswer);

// Knowledge base management
router.post('/knowledge-base', aiController.addToKnowledgeBase);
router.post('/knowledge-base/search', aiController.searchKnowledgeBase);

// Get AI-suggested reply for a ticket
router.post('/tickets/:ticketId/suggest-reply', suggestReply);

export default router; 
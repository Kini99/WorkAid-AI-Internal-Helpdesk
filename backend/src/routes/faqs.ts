import express from 'express';
import { getFaqs, createFaq, updateFaq } from '../controllers/faqController';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get FAQs for department (Accessible by authenticated users - both employee and agent)
router.get('/', getFaqs);

// Create new FAQ (Only accessible by agents)
router.post('/', requireRole(['agent']), createFaq);

// Update FAQ (Only accessible by agents)
router.put('/:id', requireRole(['agent']), updateFaq);

export default router; 
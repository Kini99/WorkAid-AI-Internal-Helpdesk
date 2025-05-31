import express from 'express';
import { getFaqs, createFaq, updateFaq } from '../controllers/faqController';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// All routes require agent role
router.use(requireRole(['agent']));

// Get FAQs for department
router.get('/', getFaqs);

// Create new FAQ
router.post('/', createFaq);

// Update FAQ
router.put('/:id', updateFaq);

export default router; 
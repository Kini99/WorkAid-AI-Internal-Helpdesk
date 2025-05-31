import express from 'express';
import { getTickets, createTicket, updateTicketStatus } from '../controllers/ticketController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get tickets (filtered by role)
router.get('/', getTickets);

// Create new ticket
router.post('/', createTicket);

// Update ticket status
router.put('/:id/status', updateTicketStatus);

export default router; 
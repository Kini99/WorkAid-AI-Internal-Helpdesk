import express from 'express';
import { getTickets, createTicket, updateTicketStatus, getTicketDetails, addReply } from '../controllers/ticketController';
import { auth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(auth);
console.log('authentication success')
// Get tickets (filtered by role)
router.get('/', getTickets);

// Create new ticket
router.post('/', createTicket);

// Get ticket details
router.get('/:id', getTicketDetails);

// Add reply to ticket
router.post('/:id/reply', addReply);

// Update ticket status
router.put('/:id/status', updateTicketStatus);

export default router; 
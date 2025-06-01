import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';
import { generateAISuggestedReply } from '../services/ai';

export const suggestReply = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can get AI suggestions' });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate('createdBy', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.department !== user.department) {
      return res.status(403).json({ message: 'Not authorized to access this ticket' });
    }

    // Generate AI-suggested reply
    const suggestedReply = await generateAISuggestedReply(ticket);

    // Return just the suggestion without adding it to the ticket
    res.json({ suggestedReply });
  } catch (error: any) {
    console.error('Suggest reply error:', error);
    res.status(500).json({ message: error.message });
  }
}; 
import { Request, Response } from 'express';
import { Ticket, ITicket } from '../models/Ticket';
import { User, IUser } from '../models/User';
import { routeTicketWithAI } from '../services/aiService';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const getTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = {};
    if (userRole === 'employee') {
      // Employees can only see their own tickets
      query = { createdBy: userId };
    } else if (userRole === 'agent') {
      // Agents can see tickets from their department. Fetch full user to get department.
      const user = await User.findById(userId) as IUser;
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      query = { department: user.department };
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email');

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user's department for fallback and ticket creation
    const user = await User.findById(userId) as IUser;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use AI to determine the appropriate department
    let department;
    try {
      department = await routeTicketWithAI(title, description);
    } catch (error) {
      // Fallback to user's department if AI routing fails
      department = user.department;
    }

    const ticket = new Ticket({
      title,
      description,
      department,
      createdBy: user._id,
      status: 'open',
    });

    await ticket.save();

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
       return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId) as IUser;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ticket = await Ticket.findById(id) as ITicket;

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (user.role === 'employee' && ticket.createdBy.toString() !== (user._id as Types.ObjectId).toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    } else if (user.role === 'agent' && ticket.department !== user.department) {
       return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error: any) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: error.message });
  }
}; 
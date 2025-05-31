import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { status, sortBy } = req.query;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {};
    let sort: any = { createdAt: -1 }; // Default sort by newest

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Set sort order
    if (sortBy === 'oldest') {
      sort = { createdAt: 1 };
    }

    // Filter tickets based on user role
    if (user.role === 'employee') {
      query.createdBy = user._id;
    } else if (user.role === 'agent') {
      query.department = user.department;
    }

    const tickets = await Ticket.find(query)
      .sort(sort)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    res.json(tickets);
  } catch (error: any) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { title, description, department } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ticket = new Ticket({
      title,
      description,
      department,
      createdBy: user._id,
    });

    await ticket.save();

    // Populate user details
    await ticket.populate('createdBy', 'firstName lastName email');

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check permissions
    if (user.role === 'employee' && ticket.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    if (user.role === 'agent' && ticket.department !== user.department) {
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
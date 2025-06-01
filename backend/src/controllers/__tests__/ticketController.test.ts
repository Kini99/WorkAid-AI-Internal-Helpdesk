import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createTicket, getTickets } from '../ticketController';
import { Ticket } from '../../models/Ticket';
import { User } from '../../models/User';
import { routeTicketWithAI } from '../../services/aiService';

// Mock the AI service and Mongoose models
jest.mock('../../services/aiService', () => ({
  routeTicketWithAI: jest.fn(),
}));
jest.mock('../../models/Ticket');
jest.mock('../../models/User');

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

describe('Ticket Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let employee: any;
  let agent: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
    mockReq = {};

    // Create mock users (adjusting to match middleware type)
    employee = {
      userId: new mongoose.Types.ObjectId().toString(), // Use userId as string
      role: 'employee',
      department: 'it',
      _id: new mongoose.Types.ObjectId(), // Keep _id for Mongoose interactions if needed
    };

    agent = {
      userId: new mongoose.Types.ObjectId().toString(), // Use userId as string
      role: 'agent',
      department: 'IT',
      _id: new mongoose.Types.ObjectId(), // Keep _id for Mongoose interactions if needed
    };

    // Mock User.findById to return the mock user when called in the controller
    (User.findById as jest.Mock).mockImplementation((id) => {
      if (id === employee._id || id === employee.userId) return employee;
      if (id === agent._id || id === agent.userId) return agent;
      return null;
    });
  });

  afterEach(async () => {
    // Clean up database
    await Ticket.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('createTicket', () => {
    it('should create a ticket with AI routing', async () => {
      mockReq.user = { userId: employee.userId, role: employee.role };
      mockReq.body = {
        title: 'Test Ticket',
        description: 'Test Description',
      };

      const mockTicket = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Ticket',
        description: 'Test Description',
        department: 'IT',
        createdBy: employee._id, // Use ObjectId for createdBy in the ticket model
        status: 'open',
      };

      (routeTicketWithAI as jest.Mock).mockResolvedValue('IT');
      (Ticket.prototype.save as jest.Mock).mockResolvedValue(mockTicket);

      await createTicket(mockReq as AuthRequest, mockRes as Response);

      expect(routeTicketWithAI).toHaveBeenCalledWith('Test Ticket', 'Test Description');
      expect(User.findById).toHaveBeenCalledWith(employee.userId);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockTicket);
    });

    it('should fallback to user department if AI routing fails', async () => {
      mockReq.user = { userId: employee.userId, role: employee.role };
      mockReq.body = {
        title: 'Test Ticket',
        description: 'Test Description',
      };

      const mockTicket = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Test Ticket',
        description: 'Test Description',
        department: 'IT',
        createdBy: employee._id,
        status: 'open',
      };

      (routeTicketWithAI as jest.Mock).mockRejectedValue(new Error('AI routing failed'));
      // User.findById is already mocked in beforeEach
      (Ticket.prototype.save as jest.Mock).mockResolvedValue(mockTicket);

      await createTicket(mockReq as AuthRequest, mockRes as Response);

      expect(routeTicketWithAI).toHaveBeenCalledWith('Test Ticket', 'Test Description');
      expect(User.findById).toHaveBeenCalledWith(employee.userId);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockTicket);
    });

    it('should handle unauthorized access', async () => {
      mockReq.body = {
        title: 'Test Ticket',
        description: 'Test Description',
      };
      mockReq.user = undefined; // Simulate unauthorized access

      await createTicket(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should handle user not found', async () => {
      mockReq.user = { userId: 'nonexistentUserId', role: 'employee' };
      mockReq.body = {
        title: 'Test Ticket',
        description: 'Test Description',
      };

      (User.findById as jest.Mock).mockResolvedValue(null); // Simulate user not found

      await createTicket(mockReq as AuthRequest, mockRes as Response);

      expect(User.findById).toHaveBeenCalledWith('nonexistentUserId');
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('getTickets', () => {
    it('should return employee tickets', async () => {
      mockReq.user = { userId: employee.userId, role: employee.role };

      const mockTickets = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Test Ticket 1',
          description: 'Test Description 1',
          department: 'IT',
          createdBy: employee._id,
          status: 'open',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Test Ticket 2',
          description: 'Test Description 2',
          department: 'IT',
          createdBy: employee._id,
          status: 'closed',
        },
      ];

      (Ticket.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTickets),
        }),
      });

      await getTickets(mockReq as AuthRequest, mockRes as Response);

      expect(Ticket.find).toHaveBeenCalledWith({ createdBy: employee.userId });
      expect(mockJson).toHaveBeenCalledWith(mockTickets);
    });

    it('should return agent tickets', async () => {
      mockReq.user = { userId: agent.userId, role: agent.role };

      const mockTickets = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Agent Ticket 1',
          description: 'Agent Description 1',
          department: 'IT',
          createdBy: employee._id,
          status: 'open',
        },
      ];

      (User.findById as jest.Mock).mockResolvedValue(agent); // Mock User.findById for agent
      (Ticket.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTickets),
        }),
      });

      await getTickets(mockReq as AuthRequest, mockRes as Response);

      expect(User.findById).toHaveBeenCalledWith(agent.userId);
      expect(Ticket.find).toHaveBeenCalledWith({ department: agent.department });
      expect(mockJson).toHaveBeenCalledWith(mockTickets);
    });

    it('should handle unauthorized access', async () => {
      mockReq.user = undefined; // Simulate unauthorized access

      await getTickets(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });
}); 
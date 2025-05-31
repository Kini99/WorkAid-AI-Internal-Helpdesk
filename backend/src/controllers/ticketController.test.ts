import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { getTickets, createTicket, updateTicketStatus } from './ticketController';
import { Ticket } from '../models/Ticket';
import { User } from '../models/User';

// Mock Express Request and Response
const mockRequest = (body = {}, params = {}, query = {}, user = {}) => ({
  body,
  params,
  query,
  user,
} as Request);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Ticket Controller', () => {
  let userId: mongoose.Types.ObjectId;
  let agentId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create test users
    const employee = await User.create({
      email: 'employee@test.com',
      password: 'Test123!@#',
      role: 'employee',
      department: 'it',
      firstName: 'John',
      lastName: 'Doe',
    });

    const agent = await User.create({
      email: 'agent@test.com',
      password: 'Test123!@#',
      role: 'agent',
      department: 'it',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    userId = employee._id;
    agentId = agent._id;

    // Create test tickets
    await Ticket.create([
      {
        title: 'Employee Ticket 1',
        description: 'Test ticket 1',
        status: 'open',
        department: 'it',
        createdBy: userId,
      },
      {
        title: 'Employee Ticket 2',
        description: 'Test ticket 2',
        status: 'in-progress',
        department: 'it',
        createdBy: userId,
      },
      {
        title: 'Other Department Ticket',
        description: 'Test ticket 3',
        status: 'open',
        department: 'hr',
        createdBy: userId,
      },
    ]);
  });

  afterEach(async () => {
    await Ticket.deleteMany({});
    await User.deleteMany({});
  });

  describe('getTickets', () => {
    it('should return employee tickets for employee role', async () => {
      const req = mockRequest({}, {}, {}, { userId });
      const res = mockResponse();

      await getTickets(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Employee Ticket 1',
            status: 'open',
          }),
          expect.objectContaining({
            title: 'Employee Ticket 2',
            status: 'in-progress',
          }),
        ])
      );
    });

    it('should return department tickets for agent role', async () => {
      const req = mockRequest({}, {}, {}, { userId: agentId });
      const res = mockResponse();

      await getTickets(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Employee Ticket 1',
            department: 'it',
          }),
          expect.objectContaining({
            title: 'Employee Ticket 2',
            department: 'it',
          }),
        ])
      );
    });

    it('should filter tickets by status', async () => {
      const req = mockRequest({}, {}, { status: 'open' }, { userId });
      const res = mockResponse();

      await getTickets(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Employee Ticket 1',
            status: 'open',
          }),
        ])
      );
      expect(res.json).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Employee Ticket 2',
            status: 'in-progress',
          }),
        ])
      );
    });
  });

  describe('createTicket', () => {
    it('should create a new ticket', async () => {
      const ticketData = {
        title: 'New Ticket',
        description: 'Test description',
        department: 'it',
      };
      const req = mockRequest(ticketData, {}, {}, { userId });
      const res = mockResponse();

      await createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Ticket',
          description: 'Test description',
          department: 'it',
          status: 'open',
        })
      );
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status for employee', async () => {
      const ticket = await Ticket.findOne({ createdBy: userId });
      const req = mockRequest(
        { status: 'resolved' },
        { id: ticket?._id },
        {},
        { userId }
      );
      const res = mockResponse();

      await updateTicketStatus(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'resolved',
        })
      );
    });

    it('should update ticket status for agent in same department', async () => {
      const ticket = await Ticket.findOne({ department: 'it' });
      const req = mockRequest(
        { status: 'in-progress' },
        { id: ticket?._id },
        {},
        { userId: agentId }
      );
      const res = mockResponse();

      await updateTicketStatus(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in-progress',
        })
      );
    });

    it('should not allow employee to update other tickets', async () => {
      const otherUser = await User.create({
        email: 'other@test.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'it',
        firstName: 'Other',
        lastName: 'User',
      });

      const ticket = await Ticket.findOne({ createdBy: otherUser._id });
      const req = mockRequest(
        { status: 'resolved' },
        { id: ticket?._id },
        {},
        { userId }
      );
      const res = mockResponse();

      await updateTicketStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this ticket',
        })
      );
    });
  });
}); 
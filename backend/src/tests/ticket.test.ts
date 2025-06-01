import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '..';
import { User } from '../models/User';
import { Ticket, ITicket } from '../models/Ticket';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Ticket.deleteMany({});
});

describe('Ticket Details & Reply Flow', () => {
  let employeeToken: string;
  let agentToken: string;
  let employeeId: mongoose.Types.ObjectId;
  let agentId: mongoose.Types.ObjectId;
  let ticketId: string;

  beforeEach(async () => {
    // Create test users
    const employee = await User.create({
      email: 'employee@test.com',
      password: 'Test123!@#',
      role: 'employee',
      department: 'it',
      firstName: 'Test',
      lastName: 'Employee',
    });

    const agent = await User.create({
      email: 'agent@test.com',
      password: 'Test123!@#',
      role: 'agent',
      department: 'it',
      firstName: 'Test',
      lastName: 'Agent',
    });

    employeeId = employee._id;
    agentId = agent._id;

    // Create tokens
    employeeToken = jwt.sign(
      { userId: employeeId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    agentToken = jwt.sign(
      { userId: agentId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create a test ticket
    const ticket = await Ticket.create({
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'open',
      department: 'it',
      createdBy: employeeId,
      messages: [],
    }) as ITicket;

    ticketId = ticket._id.toString();
  });

  describe('GET /api/tickets/:id', () => {
    it('should get ticket details for employee who created it', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Cookie', [`token=${employeeToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Ticket');
      expect(response.body.description).toBe('Test Description');
      expect(response.body.status).toBe('open');
    });

    it('should get ticket details for agent in same department', async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Cookie', [`token=${agentToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Ticket');
    });

    it('should not allow access to ticket from different department', async () => {
      // Create agent from different department
      const otherAgent = await User.create({
        email: 'other@test.com',
        password: 'Test123!@#',
        role: 'agent',
        department: 'hr',
        firstName: 'Other',
        lastName: 'Agent',
      });

      const otherToken = jwt.sign(
        { userId: otherAgent._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Cookie', [`token=${otherToken}`]);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/tickets/:id/reply', () => {
    it('should allow employee to reply to their ticket', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticketId}/reply`)
        .set('Cookie', [`token=${employeeToken}`])
        .send({ content: 'Test reply' });

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe('Test reply');
    });

    it('should allow agent to reply to ticket in their department', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticketId}/reply`)
        .set('Cookie', [`token=${agentToken}`])
        .send({ content: 'Agent reply' });

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].content).toBe('Agent reply');
    });

    it('should update ticket status to in-progress when agent replies', async () => {
      const response = await request(app)
        .post(`/api/tickets/${ticketId}/reply`)
        .set('Cookie', [`token=${agentToken}`])
        .send({ content: 'Agent reply' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in-progress');
    });
  });

  describe('PUT /api/tickets/:id/status', () => {
    it('should allow employee to mark their ticket as resolved', async () => {
      const response = await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Cookie', [`token=${employeeToken}`])
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
    });

    it('should not allow employee to mark other tickets as resolved', async () => {
      // Create another employee
      const otherEmployee = await User.create({
        email: 'other@test.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'it',
        firstName: 'Other',
        lastName: 'Employee',
      });

      const otherToken = jwt.sign(
        { userId: otherEmployee._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put(`/api/tickets/${ticketId}/status`)
        .set('Cookie', [`token=${otherToken}`])
        .send({ status: 'resolved' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/ai/tickets/:ticketId/suggest-reply', () => {
    it('should allow agent to get AI suggestion', async () => {
      const response = await request(app)
        .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
        .set('Cookie', [`token=${agentToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.messages[0].isAISuggested).toBe(true);
    });

    it('should not allow employee to get AI suggestion', async () => {
      const response = await request(app)
        .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
        .set('Cookie', [`token=${employeeToken}`]);

      expect(response.status).toBe(403);
    });

    it('should prevent duplicate AI suggestions', async () => {
      // Get first suggestion
      await request(app)
        .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
        .set('Cookie', [`token=${agentToken}`]);

      // Try to get another suggestion
      const response = await request(app)
        .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
        .set('Cookie', [`token=${agentToken}`]);

      expect(response.status).toBe(400);
    });
  });
}); 
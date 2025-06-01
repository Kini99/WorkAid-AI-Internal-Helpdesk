import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import ChatHistory from '../models/ChatHistory';
import { generateToken } from '../utils/auth';

describe('Chatbot API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workaid-test');
    
    // Create test user and generate token
    userId = new mongoose.Types.ObjectId().toString();
    token = generateToken({ _id: userId, role: 'employee' });
  });

  afterAll(async () => {
    // Clean up test data
    await ChatHistory.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear chat history before each test
    await ChatHistory.deleteMany({});
  });

  describe('POST /api/chatbot/answer-bot', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/chatbot/answer-bot')
        .send({ question: 'Test question' });

      expect(response.status).toBe(401);
    });

    it('should return 400 if question is missing', async () => {
      const response = await request(app)
        .post('/api/chatbot/answer-bot')
        .set('Cookie', [`token=${token}`])
        .send({});

      expect(response.status).toBe(400);
    });

    it('should process question and return response', async () => {
      const response = await request(app)
        .post('/api/chatbot/answer-bot')
        .set('Cookie', [`token=${token}`])
        .send({ question: 'Test question' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
    });

    it('should save chat history', async () => {
      const question = 'Test question';
      await request(app)
        .post('/api/chatbot/answer-bot')
        .set('Cookie', [`token=${token}`])
        .send({ question });

      const chatHistory = await ChatHistory.findOne({ userId });
      expect(chatHistory).toBeTruthy();
      expect(chatHistory?.question).toBe(question);
    });
  });

  describe('GET /api/chatbot/history', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/chatbot/history');

      expect(response.status).toBe(401);
    });

    it('should return empty array if no history', async () => {
      const response = await request(app)
        .get('/api/chatbot/history')
        .set('Cookie', [`token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return chat history', async () => {
      // Create test chat history
      await ChatHistory.create({
        userId,
        question: 'Test question',
        response: 'Test response',
        timestamp: new Date()
      });

      const response = await request(app)
        .get('/api/chatbot/history')
        .set('Cookie', [`token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('question', 'Test question');
      expect(response.body[0]).toHaveProperty('response', 'Test response');
    });
  });

  describe('PUT /api/chatbot/feedback/:chatId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/chatbot/feedback/123')
        .send({ wasHelpful: true });

      expect(response.status).toBe(401);
    });

    it('should return 404 if chat not found', async () => {
      const response = await request(app)
        .put('/api/chatbot/feedback/123')
        .set('Cookie', [`token=${token}`])
        .send({ wasHelpful: true });

      expect(response.status).toBe(404);
    });

    it('should update feedback', async () => {
      // Create test chat history
      const chat = await ChatHistory.create({
        userId,
        question: 'Test question',
        response: 'Test response',
        timestamp: new Date()
      });

      const response = await request(app)
        .put(`/api/chatbot/feedback/${chat._id}`)
        .set('Cookie', [`token=${token}`])
        .send({ wasHelpful: true });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wasHelpful', true);

      const updatedChat = await ChatHistory.findById(chat._id);
      expect(updatedChat?.wasHelpful).toBe(true);
    });
  });
}); 
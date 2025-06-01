import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User';
import { register, login, getMe } from './authController';

let mongoServer: MongoMemoryServer;

// Mock Express Request and Response
const mockRequest = (body = {}, user = {}) => ({
  body,
  user,
  cookies: {},
} as Request);

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'IT',
        firstName: 'John',
        lastName: 'Doe',
      });
      const res = mockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User registered successfully',
          user: expect.objectContaining({
            email: 'test@example.com',
            role: 'employee',
            department: 'IT',
            firstName: 'John',
            lastName: 'Doe',
          }),
        })
      );
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    });

    it('should not register a user with existing email', async () => {
      // Register the user first
      const req1 = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'IT',
        firstName: 'John',
        lastName: 'Doe',
      });
      const res1 = mockResponse();
      await register(req1, res1);

      // Try to register again with the same email
      const req2 = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'IT',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      const res2 = mockResponse();

      await register(req2, res2);

      expect(res2.status).toHaveBeenCalledWith(400);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User already exists',
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Register the user using the controller
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'IT',
        firstName: 'John',
        lastName: 'Doe',
      });
      const res = mockResponse();
      await register(req, res);
    });

    it('should login successfully with correct credentials', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: expect.objectContaining({
            email: 'test@example.com',
            role: 'employee',
          }),
        })
      );
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    });

    it('should not login with incorrect password', async () => {
      const req = mockRequest({
        email: 'test@example.com',
        password: 'WrongPass123!@#',
      });
      const res = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
        })
      );
    });
  });

  describe('getMe', () => {
    let userId: any;
    beforeEach(async () => {
      // Register the user using the controller
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Test123!@#',
        role: 'employee',
        department: 'IT',
        firstName: 'John',
        lastName: 'Doe',
      });
      const res = mockResponse();
      await register(req, res);
      // Get the user from DB
      const user = await User.findOne({ email: 'test@example.com' });
      userId = user?._id;
    });

    it('should return user data for authenticated user', async () => {
      const req = mockRequest({}, { userId });
      const res = mockResponse();

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          role: 'employee',
          department: 'IT',
          firstName: 'John',
          lastName: 'Doe',
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      const req = mockRequest({}, { userId: new mongoose.Types.ObjectId() });
      const res = mockResponse();

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
        })
      );
    });
  });
}); 
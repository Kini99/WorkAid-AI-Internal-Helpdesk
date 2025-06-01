import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth, requireRole } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock Express Request, Response, and NextFunction
const mockRequest = (cookies = {}) => ({
  cookies,
  user: undefined,
} as Request);

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

let mockNext: jest.Mock;

beforeEach(() => {
  mockNext = jest.fn();
});

describe('Auth Middleware', () => {
  describe('auth', () => {
    it('should authenticate user with valid token', () => {
      const token = jwt.sign({ userId: '123', role: 'employee' }, JWT_SECRET);
      const req = mockRequest({ token });
      const res = mockResponse();

      auth(req, res, mockNext as unknown as NextFunction);

      expect(req.user).toBeDefined();
      expect(req.user).toHaveProperty('userId', '123');
      expect(req.user).toHaveProperty('role', 'employee');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for missing token', () => {
      const req = mockRequest();
      const res = mockResponse();

      auth(req, res, mockNext as unknown as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      const req = mockRequest({ token: 'invalid-token' });
      const res = mockResponse();

      auth(req, res, mockNext as unknown as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid token',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with correct role', () => {
      const req = mockRequest();
      (req as any).user = { userId: '123', role: 'agent' };
      const res = mockResponse();

      const middleware = requireRole(['agent']);
      middleware(req, res, mockNext as unknown as NextFunction);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for user with incorrect role', () => {
      const req = mockRequest();
      (req as any).user = { userId: '123', role: 'employee' };
      const res = mockResponse();

      const middleware = requireRole(['agent']);
      middleware(req, res, mockNext as unknown as NextFunction);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', () => {
      const req = mockRequest();
      const res = mockResponse();

      const middleware = requireRole(['agent']);
      middleware(req, res, mockNext as unknown as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 
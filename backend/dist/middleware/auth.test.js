"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./auth");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Mock Express Request, Response, and NextFunction
const mockRequest = (cookies = {}) => ({
    cookies,
    user: undefined,
});
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
let mockNext;
beforeEach(() => {
    mockNext = jest.fn();
});
describe('Auth Middleware', () => {
    describe('auth', () => {
        it('should authenticate user with valid token', () => {
            const token = jsonwebtoken_1.default.sign({ userId: '123', role: 'employee' }, JWT_SECRET);
            const req = mockRequest({ token });
            const res = mockResponse();
            (0, auth_1.auth)(req, res, mockNext);
            expect(req.user).toBeDefined();
            expect(req.user).toHaveProperty('userId', '123');
            expect(req.user).toHaveProperty('role', 'employee');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should return 401 for missing token', () => {
            const req = mockRequest();
            const res = mockResponse();
            (0, auth_1.auth)(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Authentication required',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 401 for invalid token', () => {
            const req = mockRequest({ token: 'invalid-token' });
            const res = mockResponse();
            (0, auth_1.auth)(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid token',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireRole', () => {
        it('should allow access for user with correct role', () => {
            const req = mockRequest();
            req.user = { userId: '123', role: 'agent' };
            const res = mockResponse();
            const middleware = (0, auth_1.requireRole)(['agent']);
            middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should deny access for user with incorrect role', () => {
            const req = mockRequest();
            req.user = { userId: '123', role: 'employee' };
            const res = mockResponse();
            const middleware = (0, auth_1.requireRole)(['agent']);
            middleware(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Insufficient permissions',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should return 401 for unauthenticated user', () => {
            const req = mockRequest();
            const res = mockResponse();
            const middleware = (0, auth_1.requireRole)(['agent']);
            middleware(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Authentication required',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});

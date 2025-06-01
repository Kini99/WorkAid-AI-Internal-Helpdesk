"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const User_1 = require("../models/User");
const authController_1 = require("./authController");
let mongoServer;
// Mock Express Request and Response
const mockRequest = (body = {}, user = {}) => ({
    body,
    user,
    cookies: {},
});
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
};
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    yield mongoose_1.default.connect(mongoUri);
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.disconnect();
    yield mongoServer.stop();
}));
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.User.deleteMany({});
}));
describe('Auth Controller', () => {
    describe('register', () => {
        it('should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test123!@#',
                role: 'employee',
                department: 'IT',
                firstName: 'John',
                lastName: 'Doe',
            });
            const res = mockResponse();
            yield (0, authController_1.register)(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User registered successfully',
                user: expect.objectContaining({
                    email: 'test@example.com',
                    role: 'employee',
                    department: 'IT',
                    firstName: 'John',
                    lastName: 'Doe',
                }),
            }));
            expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
        }));
        it('should not register a user with existing email', () => __awaiter(void 0, void 0, void 0, function* () {
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
            yield (0, authController_1.register)(req1, res1);
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
            yield (0, authController_1.register)(req2, res2);
            expect(res2.status).toHaveBeenCalledWith(400);
            expect(res2.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User already exists',
            }));
        }));
    });
    describe('login', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
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
            yield (0, authController_1.register)(req, res);
        }));
        it('should login successfully with correct credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'Test123!@#',
            });
            const res = mockResponse();
            yield (0, authController_1.login)(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Login successful',
                user: expect.objectContaining({
                    email: 'test@example.com',
                    role: 'employee',
                }),
            }));
            expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
        }));
        it('should not login with incorrect password', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({
                email: 'test@example.com',
                password: 'WrongPass123!@#',
            });
            const res = mockResponse();
            yield (0, authController_1.login)(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid credentials',
            }));
        }));
    });
    describe('getMe', () => {
        let userId;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
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
            yield (0, authController_1.register)(req, res);
            // Get the user from DB
            const user = yield User_1.User.findOne({ email: 'test@example.com' });
            userId = user === null || user === void 0 ? void 0 : user._id;
        }));
        it('should return user data for authenticated user', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({}, { userId });
            const res = mockResponse();
            yield (0, authController_1.getMe)(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@example.com',
                role: 'employee',
                department: 'IT',
                firstName: 'John',
                lastName: 'Doe',
            }));
        }));
        it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({}, { userId: new mongoose_1.default.Types.ObjectId() });
            const res = mockResponse();
            yield (0, authController_1.getMe)(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User not found',
            }));
        }));
    });
});

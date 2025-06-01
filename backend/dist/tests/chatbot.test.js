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
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = __importDefault(require("../index"));
const ChatHistory_1 = __importDefault(require("../models/ChatHistory"));
const auth_utils_1 = require("../utils/auth.utils");
describe('Chatbot API', () => {
    let token;
    let userId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Connect to test database
        yield mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workaid-test');
        // Create test user and generate token
        userId = new mongoose_1.default.Types.ObjectId().toString();
        token = (0, auth_utils_1.generateToken)({ _id: userId, role: 'employee' });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data
        yield ChatHistory_1.default.deleteMany({});
        yield mongoose_1.default.connection.close();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear chat history before each test
        yield ChatHistory_1.default.deleteMany({});
    }));
    describe('POST /api/chatbot/answer-bot', () => {
        it('should return 401 if not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .post('/api/chatbot/answer-bot')
                .send({ question: 'Test question' });
            expect(response.status).toBe(401);
        }));
        it('should return 400 if question is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .post('/api/chatbot/answer-bot')
                .set('Cookie', [`token=${token}`])
                .send({});
            expect(response.status).toBe(400);
        }));
        it('should process question and return response', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .post('/api/chatbot/answer-bot')
                .set('Cookie', [`token=${token}`])
                .send({ question: 'Test question' });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('response');
        }));
        it('should save chat history', () => __awaiter(void 0, void 0, void 0, function* () {
            const question = 'Test question';
            yield (0, supertest_1.default)(index_1.default)
                .post('/api/chatbot/answer-bot')
                .set('Cookie', [`token=${token}`])
                .send({ question });
            const chatHistory = yield ChatHistory_1.default.findOne({ userId });
            expect(chatHistory).toBeTruthy();
            expect(chatHistory === null || chatHistory === void 0 ? void 0 : chatHistory.question).toBe(question);
        }));
    });
    describe('GET /api/chatbot/history', () => {
        it('should return 401 if not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .get('/api/chatbot/history');
            expect(response.status).toBe(401);
        }));
        it('should return empty array if no history', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .get('/api/chatbot/history')
                .set('Cookie', [`token=${token}`]);
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        }));
        it('should return chat history', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create test chat history
            yield ChatHistory_1.default.create({
                userId,
                question: 'Test question',
                response: 'Test response',
                timestamp: new Date()
            });
            const response = yield (0, supertest_1.default)(index_1.default)
                .get('/api/chatbot/history')
                .set('Cookie', [`token=${token}`]);
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('question', 'Test question');
            expect(response.body[0]).toHaveProperty('response', 'Test response');
        }));
    });
    describe('PUT /api/chatbot/feedback/:chatId', () => {
        it('should return 401 if not authenticated', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .put('/api/chatbot/feedback/123')
                .send({ wasHelpful: true });
            expect(response.status).toBe(401);
        }));
        it('should return 404 if chat not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(index_1.default)
                .put('/api/chatbot/feedback/123')
                .set('Cookie', [`token=${token}`])
                .send({ wasHelpful: true });
            expect(response.status).toBe(404);
        }));
        it('should update feedback', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create test chat history
            const chat = yield ChatHistory_1.default.create({
                userId,
                question: 'Test question',
                response: 'Test response',
                timestamp: new Date()
            });
            const response = yield (0, supertest_1.default)(index_1.default)
                .put(`/api/chatbot/feedback/${chat._id}`)
                .set('Cookie', [`token=${token}`])
                .send({ wasHelpful: true });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('wasHelpful', true);
            const updatedChat = yield ChatHistory_1.default.findById(chat._id);
            expect(updatedChat === null || updatedChat === void 0 ? void 0 : updatedChat.wasHelpful).toBe(true);
        }));
    });
});

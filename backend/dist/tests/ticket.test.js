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
const supertest_1 = __importDefault(require("supertest"));
const __1 = __importDefault(require(".."));
const User_1 = require("../models/User");
const Ticket_1 = require("../models/Ticket");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let mongoServer;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
    yield mongoose_1.default.connect(mongoServer.getUri());
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.disconnect();
    yield mongoServer.stop();
}));
beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield User_1.User.deleteMany({});
    yield Ticket_1.Ticket.deleteMany({});
}));
describe('Ticket Details & Reply Flow', () => {
    let employeeToken;
    let agentToken;
    let employeeId;
    let agentId;
    let ticketId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test users
        const employee = yield User_1.User.create({
            email: 'employee@test.com',
            password: 'Test123!@#',
            role: 'employee',
            department: 'it',
            firstName: 'Test',
            lastName: 'Employee',
        });
        const agent = yield User_1.User.create({
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
        employeeToken = jsonwebtoken_1.default.sign({ userId: employeeId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        agentToken = jsonwebtoken_1.default.sign({ userId: agentId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
        // Create a test ticket
        const ticket = yield Ticket_1.Ticket.create({
            title: 'Test Ticket',
            description: 'Test Description',
            status: 'open',
            department: 'it',
            createdBy: employeeId,
            messages: [],
        });
        ticketId = ticket._id.toString();
    }));
    describe('GET /api/tickets/:id', () => {
        it('should get ticket details for employee who created it', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .get(`/api/tickets/${ticketId}`)
                .set('Cookie', [`token=${employeeToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Test Ticket');
            expect(response.body.description).toBe('Test Description');
            expect(response.body.status).toBe('open');
        }));
        it('should get ticket details for agent in same department', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .get(`/api/tickets/${ticketId}`)
                .set('Cookie', [`token=${agentToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Test Ticket');
        }));
        it('should not allow access to ticket from different department', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create agent from different department
            const otherAgent = yield User_1.User.create({
                email: 'other@test.com',
                password: 'Test123!@#',
                role: 'agent',
                department: 'hr',
                firstName: 'Other',
                lastName: 'Agent',
            });
            const otherToken = jsonwebtoken_1.default.sign({ userId: otherAgent._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
            const response = yield (0, supertest_1.default)(__1.default)
                .get(`/api/tickets/${ticketId}`)
                .set('Cookie', [`token=${otherToken}`]);
            expect(response.status).toBe(403);
        }));
    });
    describe('POST /api/tickets/:id/reply', () => {
        it('should allow employee to reply to their ticket', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/tickets/${ticketId}/reply`)
                .set('Cookie', [`token=${employeeToken}`])
                .send({ content: 'Test reply' });
            expect(response.status).toBe(200);
            expect(response.body.messages).toHaveLength(1);
            expect(response.body.messages[0].content).toBe('Test reply');
        }));
        it('should allow agent to reply to ticket in their department', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/tickets/${ticketId}/reply`)
                .set('Cookie', [`token=${agentToken}`])
                .send({ content: 'Agent reply' });
            expect(response.status).toBe(200);
            expect(response.body.messages).toHaveLength(1);
            expect(response.body.messages[0].content).toBe('Agent reply');
        }));
        it('should update ticket status to in-progress when agent replies', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/tickets/${ticketId}/reply`)
                .set('Cookie', [`token=${agentToken}`])
                .send({ content: 'Agent reply' });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('in-progress');
        }));
    });
    describe('PUT /api/tickets/:id/status', () => {
        it('should allow employee to mark their ticket as resolved', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .put(`/api/tickets/${ticketId}/status`)
                .set('Cookie', [`token=${employeeToken}`])
                .send({ status: 'resolved' });
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('resolved');
        }));
        it('should not allow employee to mark other tickets as resolved', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create another employee
            const otherEmployee = yield User_1.User.create({
                email: 'other@test.com',
                password: 'Test123!@#',
                role: 'employee',
                department: 'it',
                firstName: 'Other',
                lastName: 'Employee',
            });
            const otherToken = jsonwebtoken_1.default.sign({ userId: otherEmployee._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
            const response = yield (0, supertest_1.default)(__1.default)
                .put(`/api/tickets/${ticketId}/status`)
                .set('Cookie', [`token=${otherToken}`])
                .send({ status: 'resolved' });
            expect(response.status).toBe(403);
        }));
    });
    describe('POST /api/ai/tickets/:ticketId/suggest-reply', () => {
        it('should allow agent to get AI suggestion', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
                .set('Cookie', [`token=${agentToken}`]);
            expect(response.status).toBe(200);
            expect(response.body.messages).toHaveLength(1);
            expect(response.body.messages[0].isAISuggested).toBe(true);
        }));
        it('should not allow employee to get AI suggestion', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
                .set('Cookie', [`token=${employeeToken}`]);
            expect(response.status).toBe(403);
        }));
        it('should prevent duplicate AI suggestions', () => __awaiter(void 0, void 0, void 0, function* () {
            // Get first suggestion
            yield (0, supertest_1.default)(__1.default)
                .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
                .set('Cookie', [`token=${agentToken}`]);
            // Try to get another suggestion
            const response = yield (0, supertest_1.default)(__1.default)
                .post(`/api/ai/tickets/${ticketId}/suggest-reply`)
                .set('Cookie', [`token=${agentToken}`]);
            expect(response.status).toBe(400);
        }));
    });
});

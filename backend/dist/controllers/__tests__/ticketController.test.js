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
const ticketController_1 = require("../ticketController");
const Ticket_1 = require("../../models/Ticket");
const User_1 = require("../../models/User");
const ai_service_1 = require("../../services/ai.service");
// Mock the AI service and Mongoose models
jest.mock('../../services/ai.service', () => ({
    routeTicketWithAI: jest.fn(),
}));
jest.mock('../../models/Ticket');
jest.mock('../../models/User');
describe('Ticket Controller', () => {
    let mockReq;
    let mockRes;
    let mockJson;
    let mockStatus;
    let employee;
    let agent;
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
            userId: new mongoose_1.default.Types.ObjectId().toString(), // Use userId as string
            role: 'employee',
            department: 'it',
            _id: new mongoose_1.default.Types.ObjectId(), // Keep _id for Mongoose interactions if needed
        };
        agent = {
            userId: new mongoose_1.default.Types.ObjectId().toString(), // Use userId as string
            role: 'agent',
            department: 'IT',
            _id: new mongoose_1.default.Types.ObjectId(), // Keep _id for Mongoose interactions if needed
        };
        // Mock User.findById to return the mock user when called in the controller
        User_1.User.findById.mockImplementation((id) => {
            if (id === employee._id || id === employee.userId)
                return employee;
            if (id === agent._id || id === agent.userId)
                return agent;
            return null;
        });
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up database
        yield Ticket_1.Ticket.deleteMany({});
        yield User_1.User.deleteMany({});
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mongoose_1.default.connection.close();
    }));
    describe('createTicket', () => {
        it('should create a ticket with AI routing', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employee.userId, role: employee.role };
            mockReq.body = {
                title: 'Test Ticket',
                description: 'Test Description',
            };
            const mockTicket = {
                _id: new mongoose_1.default.Types.ObjectId(),
                title: 'Test Ticket',
                description: 'Test Description',
                department: 'IT',
                createdBy: employee._id, // Use ObjectId for createdBy in the ticket model
                status: 'open',
            };
            ai_service_1.routeTicketWithAI.mockResolvedValue('IT');
            Ticket_1.Ticket.prototype.save.mockResolvedValue(mockTicket);
            yield (0, ticketController_1.createTicket)(mockReq, mockRes);
            expect(ai_service_1.routeTicketWithAI).toHaveBeenCalledWith('Test Ticket', 'Test Description');
            expect(User_1.User.findById).toHaveBeenCalledWith(employee.userId);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockTicket);
        }));
        it('should fallback to user department if AI routing fails', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employee.userId, role: employee.role };
            mockReq.body = {
                title: 'Test Ticket',
                description: 'Test Description',
            };
            const mockTicket = {
                _id: new mongoose_1.default.Types.ObjectId(),
                title: 'Test Ticket',
                description: 'Test Description',
                department: 'IT',
                createdBy: employee._id,
                status: 'open',
            };
            ai_service_1.routeTicketWithAI.mockRejectedValue(new Error('AI routing failed'));
            // User.findById is already mocked in beforeEach
            Ticket_1.Ticket.prototype.save.mockResolvedValue(mockTicket);
            yield (0, ticketController_1.createTicket)(mockReq, mockRes);
            expect(ai_service_1.routeTicketWithAI).toHaveBeenCalledWith('Test Ticket', 'Test Description');
            expect(User_1.User.findById).toHaveBeenCalledWith(employee.userId);
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(mockTicket);
        }));
        it('should handle unauthorized access', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.body = {
                title: 'Test Ticket',
                description: 'Test Description',
            };
            mockReq.user = undefined; // Simulate unauthorized access
            yield (0, ticketController_1.createTicket)(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
        }));
        it('should handle user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: 'nonexistentUserId', role: 'employee' };
            mockReq.body = {
                title: 'Test Ticket',
                description: 'Test Description',
            };
            User_1.User.findById.mockResolvedValue(null); // Simulate user not found
            yield (0, ticketController_1.createTicket)(mockReq, mockRes);
            expect(User_1.User.findById).toHaveBeenCalledWith('nonexistentUserId');
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        }));
    });
    describe('getTickets', () => {
        it('should return employee tickets', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employee.userId, role: employee.role };
            const mockTickets = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    title: 'Test Ticket 1',
                    description: 'Test Description 1',
                    department: 'IT',
                    createdBy: employee._id,
                    status: 'open',
                },
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    title: 'Test Ticket 2',
                    description: 'Test Description 2',
                    department: 'IT',
                    createdBy: employee._id,
                    status: 'closed',
                },
            ];
            Ticket_1.Ticket.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTickets),
                }),
            });
            yield (0, ticketController_1.getTickets)(mockReq, mockRes);
            expect(Ticket_1.Ticket.find).toHaveBeenCalledWith({ createdBy: employee.userId });
            expect(mockJson).toHaveBeenCalledWith(mockTickets);
        }));
        it('should return agent tickets', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agent.userId, role: agent.role };
            const mockTickets = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    title: 'Agent Ticket 1',
                    description: 'Agent Description 1',
                    department: 'IT',
                    createdBy: employee._id,
                    status: 'open',
                },
            ];
            User_1.User.findById.mockResolvedValue(agent); // Mock User.findById for agent
            Ticket_1.Ticket.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockTickets),
                }),
            });
            yield (0, ticketController_1.getTickets)(mockReq, mockRes);
            expect(User_1.User.findById).toHaveBeenCalledWith(agent.userId);
            expect(Ticket_1.Ticket.find).toHaveBeenCalledWith({ department: agent.department });
            expect(mockJson).toHaveBeenCalledWith(mockTickets);
        }));
        it('should handle unauthorized access', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = undefined; // Simulate unauthorized access
            yield (0, ticketController_1.getTickets)(mockReq, mockRes);
            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
        }));
    });
});

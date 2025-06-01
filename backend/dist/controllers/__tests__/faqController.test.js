"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const faqController_1 = require("../faqController");
const FAQ_1 = require("../../models/FAQ");
const User_1 = require("../../models/User");
const mongoose_1 = __importStar(require("mongoose"));
// Mock the FAQ and User models
jest.mock('../../models/FAQ');
jest.mock('../../models/User');
// Cast the mocked FAQ and User to their mocked types
const MockedFAQ = FAQ_1.FAQ;
const MockedUser = User_1.User;
describe('FAQ Controller', () => {
    let mockReq;
    let mockRes;
    let mockJson;
    let mockStatus;
    let employeeUser;
    let agentUser;
    beforeEach(() => {
        jest.clearAllMocks();
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = {
            json: mockJson,
            status: mockStatus,
        };
        mockReq = {};
        employeeUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
            role: 'employee',
            department: 'it',
            firstName: 'Test',
            lastName: 'Employee',
            email: 'employee@example.com',
        };
        agentUser = {
            _id: new mongoose_1.default.Types.ObjectId(),
            role: 'agent',
            department: 'IT',
            firstName: 'Test',
            lastName: 'Agent',
            email: 'agent@example.com',
        };
        // Mock User.findById
        MockedUser.findById.mockImplementation((userId) => {
            const query = new mongoose_1.Query();
            query.exec = jest.fn().mockResolvedValue({
                _id: userId,
                role: 'agent',
                department: 'IT'
            });
            return query;
        });
        // Mock FAQ.find
        MockedFAQ.find.mockImplementation(() => {
            const query = new mongoose_1.Query();
            query.sort = jest.fn().mockReturnThis();
            query.populate = jest.fn().mockResolvedValue([]);
            return query;
        });
        // Mock FAQ.findById
        MockedFAQ.findById.mockImplementation((id) => {
            const query = new mongoose_1.Query();
            query.exec = jest.fn().mockResolvedValue(null);
            return query;
        });
        // Mock FAQ constructor
        const mockFaq = {
            _id: new mongoose_1.default.Types.ObjectId(),
            question: '',
            answer: '',
            department: '',
            createdBy: new mongoose_1.default.Types.ObjectId(),
            populate: jest.fn().mockReturnThis(),
            save: jest.fn().mockResolvedValue(true)
        };
        MockedFAQ.mockImplementation(() => mockFaq);
    });
    describe('getFaqs', () => {
        it('should return all FAQs for an agent', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const mockFAQs = [
                {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    question: 'Test Question 1',
                    answer: 'Test Answer 1',
                    category: 'general',
                    department: agentUser.department,
                    createdBy: agentUser._id,
                },
            ];
            // Refine FAQ.find mock for this specific test case
            MockedFAQ.find.mockImplementation(() => ({
                sort: jest.fn().mockImplementation(() => ({
                    populate: jest.fn().mockResolvedValue(mockFAQs),
                })),
            }));
            yield (0, faqController_1.getFaqs)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            // Check that exec was called on the findById query
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ.find).toHaveBeenCalledWith({ department: agentUser.department });
            // Check that sort and populate were called on the find query
            const findCall = MockedFAQ.find.mock.results[0].value;
            expect(findCall.sort).toHaveBeenCalledWith({ createdAt: -1 });
            const sortCall = findCall.sort.mock.results[0].value;
            expect(sortCall.populate).toHaveBeenCalledWith('createdBy', 'firstName lastName email');
            expect(mockJson).toHaveBeenCalledWith(mockFAQs);
        }));
        it('should return 403 for a non-agent user', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };
            yield (0, faqController_1.getFaqs)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can access FAQs' });
        }));
        it('should handle user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: 'nonexistentUserId', role: 'agent' };
            yield (0, faqController_1.getFaqs)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith('nonexistentUserId');
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        }));
        it('should handle errors fetching FAQs', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const error = new Error('Database error');
            // Refine FAQ.find mock for this specific test case to reject
            MockedFAQ.find.mockImplementation(() => ({
                sort: jest.fn().mockImplementation(() => ({
                    populate: jest.fn().mockRejectedValue(error),
                })),
            }));
            yield (0, faqController_1.getFaqs)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: error.message });
        }));
    });
    describe('createFaq', () => {
        it('should create a new FAQ for an agent and return the populated FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const newFAQData = {
                question: 'New Question',
                answer: 'New Answer',
            };
            mockReq.body = newFAQData;
            // The FAQ constructor mock now handles the save and populate mocks and returns the mock instance
            yield (0, faqController_1.createFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ).toHaveBeenCalledWith(Object.assign(Object.assign({}, newFAQData), { department: agentUser.department, createdBy: agentUser._id }));
            const createdFAQInstance = (MockedFAQ.mock.instances[0]);
            expect(createdFAQInstance.save).toHaveBeenCalled();
            expect(createdFAQInstance.populate).toHaveBeenCalledWith('createdBy', 'firstName lastName email');
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining(Object.assign(Object.assign({}, newFAQData), { department: agentUser.department, createdBy: {
                    _id: agentUser._id,
                    firstName: agentUser.firstName,
                    lastName: agentUser.lastName,
                    email: agentUser.email,
                } })));
        }));
        it('should return 403 for a non-agent user trying to create FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };
            mockReq.body = {
                question: 'New Question',
                answer: 'New Answer',
            };
            yield (0, faqController_1.createFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can create FAQs' });
        }));
        it('should handle validation errors when creating FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            mockReq.body = { question: '', answer: '' };
            // Mock the save method of the created FAQ instance to reject with a Mongoose validation error
            FAQ_1.FAQ.prototype.save.mockRejectedValue(new Error('FAQ validation failed'));
            yield (0, faqController_1.createFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Database error' });
        }));
        it('should handle errors creating FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            mockReq.body = { question: 'New Question', answer: 'New Answer' };
            const error = new Error('Database error');
            FAQ_1.FAQ.prototype.save.mockRejectedValue(error);
            yield (0, faqController_1.createFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: error.message });
        }));
    });
    describe('updateFaq', () => {
        it('should update an existing FAQ for an agent in the correct department', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const faqId = new mongoose_1.default.Types.ObjectId();
            const updatedFAQData = {
                question: 'Updated Question',
                answer: 'Updated Answer',
            };
            mockReq.params = { id: faqId.toString() };
            mockReq.body = updatedFAQData;
            const existingFAQ = {
                _id: faqId,
                question: 'Old Question',
                answer: 'Old Answer',
                department: agentUser.department,
                createdBy: new mongoose_1.default.Types.ObjectId(),
                save: jest.fn().mockResolvedValue(true),
            };
            // Mock FAQ.findById to return the existing FAQ document with exec
            MockedFAQ.findById.mockImplementation((id) => ({
                exec: jest.fn().mockResolvedValue(existingFAQ),
            }));
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const userFindByIdCall = MockedUser.findById.mock.results[0].value;
            expect(userFindByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
            const faqFindByIdCall = MockedFAQ.findById.mock.results[0].value;
            expect(faqFindByIdCall.exec).toHaveBeenCalled();
            expect(existingFAQ.question).toBe(updatedFAQData.question);
            expect(existingFAQ.answer).toBe(updatedFAQData.answer);
            expect(existingFAQ.save).toHaveBeenCalled();
            expect(mockJson).toHaveBeenCalledWith(existingFAQ);
        }));
        it('should return 403 for a non-agent user trying to update FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };
            const faqId = new mongoose_1.default.Types.ObjectId();
            mockReq.params = { id: faqId.toString() };
            mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
            const findByIdCall = MockedUser.findById.mock.results[0].value;
            expect(findByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can update FAQs' });
        }));
        it('should return 403 for an agent updating FAQ in a different department', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const faqId = new mongoose_1.default.Types.ObjectId();
            mockReq.params = { id: faqId.toString() };
            mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
            const existingFAQ = {
                _id: faqId,
                department: 'HR',
                save: jest.fn(), // Add save mock as it might be called before the department check depending on implementation
            };
            // Mock FAQ.findById to return the existing FAQ document with exec
            MockedFAQ.findById.mockImplementation((id) => ({
                exec: jest.fn().mockResolvedValue(existingFAQ),
            }));
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const userFindByIdCall = MockedUser.findById.mock.results[0].value;
            expect(userFindByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
            const faqFindByIdCall = MockedFAQ.findById.mock.results[0].value;
            expect(faqFindByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({ message: 'Not authorized to update this FAQ' });
        }));
        it('should handle non-existent FAQ when updating', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const faqId = new mongoose_1.default.Types.ObjectId();
            mockReq.params = { id: faqId.toString() };
            mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
            // Mock FAQ.findById to return null with exec
            MockedFAQ.findById.mockImplementation((id) => ({
                exec: jest.fn().mockResolvedValue(null),
            }));
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const userFindByIdCall = MockedUser.findById.mock.results[0].value;
            expect(userFindByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
            const faqFindByIdCall = MockedFAQ.findById.mock.results[0].value;
            expect(faqFindByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'FAQ not found' });
        }));
        it('should handle user not found when updating FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: 'nonexistentUserId', role: 'agent' };
            const faqId = new mongoose_1.default.Types.ObjectId();
            mockReq.params = { id: faqId.toString() };
            mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
            // Mock User.findById to return null with exec
            MockedUser.findById.mockImplementation((userId) => ({
                exec: jest.fn().mockResolvedValue(null),
            }));
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith('nonexistentUserId');
            const userFindByIdCall = MockedUser.findById.mock.results[0].value;
            expect(userFindByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
        }));
        it('should handle errors updating FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
            const faqId = new mongoose_1.default.Types.ObjectId();
            mockReq.params = { id: faqId.toString() };
            mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
            const error = new Error('Database error');
            const existingFAQ = {
                _id: faqId,
                department: agentUser.department,
                save: jest.fn().mockRejectedValue(error),
            };
            // Mock FAQ.findById to return the existing FAQ document with exec
            MockedFAQ.findById.mockImplementation((id) => ({
                exec: jest.fn().mockResolvedValue(existingFAQ),
            }));
            yield (0, faqController_1.updateFaq)(mockReq, mockRes);
            expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
            const userFindByIdCall = MockedUser.findById.mock.results[0].value;
            expect(userFindByIdCall.exec).toHaveBeenCalled();
            expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
            const faqFindByIdCall = MockedFAQ.findById.mock.results[0].value;
            expect(faqFindByIdCall.exec).toHaveBeenCalled();
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({ message: error.message });
        }));
    });
});

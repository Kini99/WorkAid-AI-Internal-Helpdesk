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
Object.defineProperty(exports, "__esModule", { value: true });
const faqController_1 = require("./faqController");
const FAQ_1 = require("../models/FAQ");
const User_1 = require("../models/User");
// Mock Express Request and Response
const mockRequest = (body = {}, params = {}, user = {}) => ({
    body,
    params,
    user,
});
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
describe('FAQ Controller', () => {
    let agentId;
    let employeeId;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Create test users
        const agent = yield User_1.User.create({
            email: 'agent@test.com',
            password: 'Test123!@#',
            role: 'agent',
            department: 'it',
            firstName: 'Jane',
            lastName: 'Smith',
        });
        const employee = yield User_1.User.create({
            email: 'employee@test.com',
            password: 'Test123!@#',
            role: 'employee',
            department: 'it',
            firstName: 'John',
            lastName: 'Doe',
        });
        agentId = agent._id;
        employeeId = employee._id;
        // Create test FAQs
        yield FAQ_1.FAQ.create([
            {
                question: 'IT FAQ 1',
                answer: 'IT Answer 1',
                department: 'it',
                createdBy: agentId,
            },
            {
                question: 'IT FAQ 2',
                answer: 'IT Answer 2',
                department: 'it',
                createdBy: agentId,
            },
            {
                question: 'HR FAQ',
                answer: 'HR Answer',
                department: 'hr',
                createdBy: agentId,
            },
        ]);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield FAQ_1.FAQ.deleteMany({});
        yield User_1.User.deleteMany({});
    }));
    describe('getFaqs', () => {
        it('should return FAQs for agent in their department', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({}, {}, { userId: agentId });
            const res = mockResponse();
            yield (0, faqController_1.getFaqs)(req, res);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    question: 'IT FAQ 1',
                    department: 'it',
                }),
                expect.objectContaining({
                    question: 'IT FAQ 2',
                    department: 'it',
                }),
            ]));
        }));
        it('should not allow employee to access FAQs', () => __awaiter(void 0, void 0, void 0, function* () {
            const req = mockRequest({}, {}, { userId: employeeId });
            const res = mockResponse();
            yield (0, faqController_1.getFaqs)(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Only agents can access FAQs',
            }));
        }));
    });
    describe('createFaq', () => {
        it('should create a new FAQ for agent', () => __awaiter(void 0, void 0, void 0, function* () {
            const faqData = {
                question: 'New FAQ',
                answer: 'New Answer',
            };
            const req = mockRequest(faqData, {}, { userId: agentId });
            const res = mockResponse();
            yield (0, faqController_1.createFaq)(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                question: 'New FAQ',
                answer: 'New Answer',
                department: 'it',
            }));
        }));
        it('should not allow employee to create FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            const faqData = {
                question: 'New FAQ',
                answer: 'New Answer',
            };
            const req = mockRequest(faqData, {}, { userId: employeeId });
            const res = mockResponse();
            yield (0, faqController_1.createFaq)(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Only agents can create FAQs',
            }));
        }));
    });
    describe('updateFaq', () => {
        it('should update FAQ for agent in same department', () => __awaiter(void 0, void 0, void 0, function* () {
            const faq = yield FAQ_1.FAQ.findOne({ department: 'it' });
            const updateData = {
                question: 'Updated Question',
                answer: 'Updated Answer',
            };
            const req = mockRequest(updateData, { id: faq === null || faq === void 0 ? void 0 : faq._id }, { userId: agentId });
            const res = mockResponse();
            yield (0, faqController_1.updateFaq)(req, res);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                question: 'Updated Question',
                answer: 'Updated Answer',
            }));
        }));
        it('should not allow employee to update FAQ', () => __awaiter(void 0, void 0, void 0, function* () {
            const faq = yield FAQ_1.FAQ.findOne({ department: 'it' });
            const updateData = {
                question: 'Updated Question',
                answer: 'Updated Answer',
            };
            const req = mockRequest(updateData, { id: faq === null || faq === void 0 ? void 0 : faq._id }, { userId: employeeId });
            const res = mockResponse();
            yield (0, faqController_1.updateFaq)(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Only agents can update FAQs',
            }));
        }));
        it('should not allow agent to update FAQ from different department', () => __awaiter(void 0, void 0, void 0, function* () {
            const faq = yield FAQ_1.FAQ.findOne({ department: 'hr' });
            const updateData = {
                question: 'Updated Question',
                answer: 'Updated Answer',
            };
            const req = mockRequest(updateData, { id: faq === null || faq === void 0 ? void 0 : faq._id }, { userId: agentId });
            const res = mockResponse();
            yield (0, faqController_1.updateFaq)(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authorized to update this FAQ',
            }));
        }));
    });
});

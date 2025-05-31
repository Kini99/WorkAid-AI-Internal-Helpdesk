import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { getFaqs, createFaq, updateFaq } from './faqController';
import { FAQ } from '../models/FAQ';
import { User } from '../models/User';

// Mock Express Request and Response
const mockRequest = (body = {}, params = {}, user = {}) => ({
  body,
  params,
  user,
} as Request);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('FAQ Controller', () => {
  let agentId: mongoose.Types.ObjectId;
  let employeeId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create test users
    const agent = await User.create({
      email: 'agent@test.com',
      password: 'Test123!@#',
      role: 'agent',
      department: 'it',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    const employee = await User.create({
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
    await FAQ.create([
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
  });

  afterEach(async () => {
    await FAQ.deleteMany({});
    await User.deleteMany({});
  });

  describe('getFaqs', () => {
    it('should return FAQs for agent in their department', async () => {
      const req = mockRequest({}, {}, { userId: agentId });
      const res = mockResponse();

      await getFaqs(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            question: 'IT FAQ 1',
            department: 'it',
          }),
          expect.objectContaining({
            question: 'IT FAQ 2',
            department: 'it',
          }),
        ])
      );
    });

    it('should not allow employee to access FAQs', async () => {
      const req = mockRequest({}, {}, { userId: employeeId });
      const res = mockResponse();

      await getFaqs(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only agents can access FAQs',
        })
      );
    });
  });

  describe('createFaq', () => {
    it('should create a new FAQ for agent', async () => {
      const faqData = {
        question: 'New FAQ',
        answer: 'New Answer',
      };
      const req = mockRequest(faqData, {}, { userId: agentId });
      const res = mockResponse();

      await createFaq(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'New FAQ',
          answer: 'New Answer',
          department: 'it',
        })
      );
    });

    it('should not allow employee to create FAQ', async () => {
      const faqData = {
        question: 'New FAQ',
        answer: 'New Answer',
      };
      const req = mockRequest(faqData, {}, { userId: employeeId });
      const res = mockResponse();

      await createFaq(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only agents can create FAQs',
        })
      );
    });
  });

  describe('updateFaq', () => {
    it('should update FAQ for agent in same department', async () => {
      const faq = await FAQ.findOne({ department: 'it' });
      const updateData = {
        question: 'Updated Question',
        answer: 'Updated Answer',
      };
      const req = mockRequest(updateData, { id: faq?._id }, { userId: agentId });
      const res = mockResponse();

      await updateFaq(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'Updated Question',
          answer: 'Updated Answer',
        })
      );
    });

    it('should not allow employee to update FAQ', async () => {
      const faq = await FAQ.findOne({ department: 'it' });
      const updateData = {
        question: 'Updated Question',
        answer: 'Updated Answer',
      };
      const req = mockRequest(updateData, { id: faq?._id }, { userId: employeeId });
      const res = mockResponse();

      await updateFaq(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Only agents can update FAQs',
        })
      );
    });

    it('should not allow agent to update FAQ from different department', async () => {
      const faq = await FAQ.findOne({ department: 'hr' });
      const updateData = {
        question: 'Updated Question',
        answer: 'Updated Answer',
      };
      const req = mockRequest(updateData, { id: faq?._id }, { userId: agentId });
      const res = mockResponse();

      await updateFaq(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not authorized to update this FAQ',
        })
      );
    });
  });
}); 
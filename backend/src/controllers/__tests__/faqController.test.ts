import { Request, Response } from 'express';
import { getFaqs, createFaq, updateFaq } from '../faqController';
import { FAQ } from '../../models/FAQ';
import { User } from '../../models/User';
import mongoose, { Document, Types } from 'mongoose';

// Mock the FAQ and User models
jest.mock('../../models/FAQ');
jest.mock('../../models/User');

// Define types for mock Mongoose documents to ensure expected properties
interface MockFAQDocument extends Document {
  question: string;
  answer: string;
  category?: string;
  department: string;
  createdBy: Types.ObjectId | string;
  populate: jest.Mock;
  save: jest.Mock;
}

interface MockUserDocument extends Document {
   _id: Types.ObjectId;
  role: string;
  department: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Define a type for the AuthRequest in tests, matching the middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

// Cast the mocked FAQ and User to their mocked types for easier access
const MockedFAQ = FAQ as jest.Mocked<typeof FAQ>;
const MockedUser = User as jest.Mocked<typeof User>;

describe('FAQ Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let employeeUser: MockUserDocument;
  let agentUser: MockUserDocument;

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
      _id: new mongoose.Types.ObjectId(),
      role: 'employee',
      department: 'it',
      firstName: 'Test',
      lastName: 'Employee',
      email: 'employee@example.com',
    } as MockUserDocument;
    agentUser = {
      _id: new mongoose.Types.ObjectId(),
      role: 'agent',
      department: 'IT',
      firstName: 'Test',
      lastName: 'Agent',
      email: 'agent@example.com',
    } as MockUserDocument;

    // Mock User.findById to return a query-like object with exec
    MockedUser.findById.mockImplementation((userId: string) => ({
      exec: jest.fn().mockResolvedValue((() => {
        if (userId === employeeUser._id.toString()) return employeeUser;
        if (userId === agentUser._id.toString()) return agentUser;
        return null;
      })()),
    }));

    // Mock FAQ.find to return a query-like object with sort and populate
    MockedFAQ.find.mockImplementation(() => ({
      sort: jest.fn().mockImplementation(() => ({
        populate: jest.fn().mockResolvedValue([]), // Default to empty array
      })),
    }));

    // Mock FAQ.findById to return a query-like object with exec
    MockedFAQ.findById.mockImplementation((id: string) => ({
       exec: jest.fn().mockResolvedValue(null), // Default to not found
    }));

    // Mock FAQ.findByIdAndUpdate to return a query-like object with exec
    MockedFAQ.findByIdAndUpdate.mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue(null), // Default to null
    }));

    // Mock FAQ constructor
    MockedFAQ.mockImplementation((data: any) => {
      const mockFaq = {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        populate: jest.fn(),
        save: jest.fn(),
      } as MockFAQDocument;
      // Mock the instance's save method to return the instance itself resolved in a promise
      mockFaq.save.mockResolvedValue(mockFaq);
      // Mock the instance's populate method to return the instance with a mocked populated createdBy
      mockFaq.populate.mockResolvedValue({...mockFaq, createdBy: { 
        _id: mockFaq.createdBy, firstName: employeeUser.firstName, lastName: employeeUser.lastName, email: employeeUser.email
      }}); 
      return mockFaq;
    });
  });

  describe('getFaqs', () => {
    it('should return all FAQs for an agent', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };

      const mockFAQs = [
        {
          _id: new mongoose.Types.ObjectId(),
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

      await getFaqs(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       // Check that exec was called on the findById query
      const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();

      expect(MockedFAQ.find).toHaveBeenCalledWith({ department: agentUser.department });
       // Check that sort and populate were called on the find query
      const findCall = (MockedFAQ.find as jest.Mock).mock.results[0].value;
      expect(findCall.sort).toHaveBeenCalledWith({ createdAt: -1 });
      const sortCall = findCall.sort.mock.results[0].value;
      expect(sortCall.populate).toHaveBeenCalledWith('createdBy', 'firstName lastName email');

      expect(mockJson).toHaveBeenCalledWith(mockFAQs);
    });

    it('should return 403 for a non-agent user', async () => {
      mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };

      await getFaqs(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can access FAQs' });
    });

     it('should handle user not found', async () => {
      mockReq.user = { userId: 'nonexistentUserId', role: 'agent' };

      await getFaqs(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith('nonexistentUserId');
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors fetching FAQs', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
      const error = new Error('Database error');
      // Refine FAQ.find mock for this specific test case to reject
      MockedFAQ.find.mockImplementation(() => ({
        sort: jest.fn().mockImplementation(() => ({
           populate: jest.fn().mockRejectedValue(error),
        })),
      }));

      await getFaqs(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: error.message });
    });
  });

  describe('createFaq', () => {
    it('should create a new FAQ for an agent and return the populated FAQ', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
      const newFAQData = {
        question: 'New Question',
        answer: 'New Answer',
      };
      mockReq.body = newFAQData;

      // The FAQ constructor mock now handles the save and populate mocks and returns the mock instance
      await createFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();

      expect(MockedFAQ).toHaveBeenCalledWith({
        ...newFAQData,
        department: agentUser.department,
        createdBy: agentUser._id,
      });
      const createdFAQInstance = (MockedFAQ.mock.instances[0]) as MockFAQDocument;
      expect(createdFAQInstance.save).toHaveBeenCalled();
      expect(createdFAQInstance.populate).toHaveBeenCalledWith('createdBy', 'firstName lastName email');
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
         ...newFAQData,
         department: agentUser.department,
         createdBy: { 
           _id: agentUser._id,
           firstName: agentUser.firstName,
           lastName: agentUser.lastName,
           email: agentUser.email,
         },
      }));
    });

    it('should return 403 for a non-agent user trying to create FAQ', async () => {
      mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };
      mockReq.body = {
        question: 'New Question',
        answer: 'New Answer',
      };

      await createFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can create FAQs' });
    });

    it('should handle validation errors when creating FAQ', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
      mockReq.body = { question: '', answer: '' };

      // Mock the save method of the created FAQ instance to reject with a Mongoose validation error
      (FAQ.prototype.save as jest.Mock).mockRejectedValue(new Error('FAQ validation failed'));

      await createFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Database error' });
    });

     it('should handle errors creating FAQ', async () => {
       mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
       mockReq.body = { question: 'New Question', answer: 'New Answer' };
       const error = new Error('Database error');

       (FAQ.prototype.save as jest.Mock).mockRejectedValue(error);

       await createFaq(mockReq as AuthRequest, mockRes as Response);

       expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
       expect(mockStatus).toHaveBeenCalledWith(500);
       expect(mockJson).toHaveBeenCalledWith({ message: error.message });
     });
  });

  describe('updateFaq', () => {
    it('should update an existing FAQ for an agent in the correct department', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
      const faqId = new mongoose.Types.ObjectId();
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
        createdBy: new mongoose.Types.ObjectId(),
        save: jest.fn().mockResolvedValue(true),
      } as MockFAQDocument;

      // Mock FAQ.findById to return the existing FAQ document with exec
      MockedFAQ.findById.mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(existingFAQ),
      }));

      await updateFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const userFindByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(userFindByIdCall.exec).toHaveBeenCalled();

      expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
       const faqFindByIdCall = (MockedFAQ.findById as jest.Mock).mock.results[0].value;
      expect(faqFindByIdCall.exec).toHaveBeenCalled();

      expect(existingFAQ.question).toBe(updatedFAQData.question);
      expect(existingFAQ.answer).toBe(updatedFAQData.answer);
      expect(existingFAQ.save).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith(existingFAQ);
    });

    it('should return 403 for a non-agent user trying to update FAQ', async () => {
      mockReq.user = { userId: employeeUser._id.toString(), role: employeeUser.role };
      const faqId = new mongoose.Types.ObjectId();
      mockReq.params = { id: faqId.toString() };
      mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };

      await updateFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(employeeUser._id.toString());
       const findByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(findByIdCall.exec).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Only agents can update FAQs' });
    });

     it('should return 403 for an agent updating FAQ in a different department', async () => {
       mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
       const faqId = new mongoose.Types.ObjectId();
       mockReq.params = { id: faqId.toString() };
       mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };

       const existingFAQ = {
         _id: faqId,
         department: 'HR',
         save: jest.fn(), // Add save mock as it might be called before the department check depending on implementation
       } as MockFAQDocument;

       // Mock FAQ.findById to return the existing FAQ document with exec
       MockedFAQ.findById.mockImplementation((id: string) => ({
          exec: jest.fn().mockResolvedValue(existingFAQ),
       }));

       await updateFaq(mockReq as AuthRequest, mockRes as Response);

       expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
        const userFindByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
       expect(userFindByIdCall.exec).toHaveBeenCalled();

       expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
        const faqFindByIdCall = (MockedFAQ.findById as jest.Mock).mock.results[0].value;
       expect(faqFindByIdCall.exec).toHaveBeenCalled();

       expect(mockStatus).toHaveBeenCalledWith(403);
       expect(mockJson).toHaveBeenCalledWith({ message: 'Not authorized to update this FAQ' });
     });

    it('should handle non-existent FAQ when updating', async () => {
      mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
      const faqId = new mongoose.Types.ObjectId();
      mockReq.params = { id: faqId.toString() };
      mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };

       // Mock FAQ.findById to return null with exec
      MockedFAQ.findById.mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await updateFaq(mockReq as AuthRequest, mockRes as Response);

      expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
       const userFindByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
      expect(userFindByIdCall.exec).toHaveBeenCalled();

      expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
       const faqFindByIdCall = (MockedFAQ.findById as jest.Mock).mock.results[0].value;
      expect(faqFindByIdCall.exec).toHaveBeenCalled();

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'FAQ not found' });
    });

     it('should handle user not found when updating FAQ', async () => {
       mockReq.user = { userId: 'nonexistentUserId', role: 'agent' };
       const faqId = new mongoose.Types.ObjectId();
       mockReq.params = { id: faqId.toString() };
       mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };

        // Mock User.findById to return null with exec
       MockedUser.findById.mockImplementation((userId: string) => ({
         exec: jest.fn().mockResolvedValue(null),
       }));

       await updateFaq(mockReq as AuthRequest, mockRes as Response);

       expect(MockedUser.findById).toHaveBeenCalledWith('nonexistentUserId');
        const userFindByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
       expect(userFindByIdCall.exec).toHaveBeenCalled();
       expect(mockStatus).toHaveBeenCalledWith(404);
       expect(mockJson).toHaveBeenCalledWith({ message: 'User not found' });
     });

     it('should handle errors updating FAQ', async () => {
       mockReq.user = { userId: agentUser._id.toString(), role: agentUser.role };
       const faqId = new mongoose.Types.ObjectId();
       mockReq.params = { id: faqId.toString() };
       mockReq.body = { question: 'Updated Question', answer: 'Updated Answer' };
       const error = new Error('Database error');

       const existingFAQ = {
         _id: faqId,
         department: agentUser.department,
         save: jest.fn().mockRejectedValue(error),
       } as MockFAQDocument;

        // Mock FAQ.findById to return the existing FAQ document with exec
       MockedFAQ.findById.mockImplementation((id: string) => ({
         exec: jest.fn().mockResolvedValue(existingFAQ),
       }));

       await updateFaq(mockReq as AuthRequest, mockRes as Response);

       expect(MockedUser.findById).toHaveBeenCalledWith(agentUser._id.toString());
        const userFindByIdCall = (MockedUser.findById as jest.Mock).mock.results[0].value;
       expect(userFindByIdCall.exec).toHaveBeenCalled();

       expect(MockedFAQ.findById).toHaveBeenCalledWith(faqId.toString());
        const faqFindByIdCall = (MockedFAQ.findById as jest.Mock).mock.results[0].value;
       expect(faqFindByIdCall.exec).toHaveBeenCalled();

       expect(mockStatus).toHaveBeenCalledWith(500);
       expect(mockJson).toHaveBeenCalledWith({ message: error.message });
     });
  });
});
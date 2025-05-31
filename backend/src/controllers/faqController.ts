import { Request, Response } from 'express';
import { FAQ } from '../models/FAQ';
import { User } from '../models/User';

export const getFaqs = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only agents can access FAQs
    if (user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can access FAQs' });
    }

    const faqs = await FAQ.find({ department: user.department })
      .populate('createdBy', 'firstName lastName email');

    res.json(faqs);
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only agents can create FAQs
    if (user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can create FAQs' });
    }

    const faq = new FAQ({
      question,
      answer,
      department: user.department,
      createdBy: user._id,
    });

    await faq.save();

    // Populate user details
    await faq.populate('createdBy', 'firstName lastName email');

    res.status(201).json(faq);
  } catch (error: any) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only agents can update FAQs
    if (user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can update FAQs' });
    }

    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    // Check if FAQ belongs to agent's department
    if (faq.department !== user.department) {
      return res.status(403).json({ message: 'Not authorized to update this FAQ' });
    }

    faq.question = question;
    faq.answer = answer;
    await faq.save();

    res.json(faq);
  } catch (error: any) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ message: error.message });
  }
}; 
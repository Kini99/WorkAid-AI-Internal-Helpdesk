import { Request, Response } from 'express';
import { FAQ } from '../models/FAQ';
import { User } from '../models/User';
import { aiService } from '../services/ai.service';

export const getFaqs = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = user.role === 'agent' ? { department: user.department } : {};

    const faqs = await FAQ.find(query)
      .populate('createdBy', 'firstName lastName email')
      .lean();
    res.json(faqs);
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
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

    // Add the newly created FAQ to ChromaDB
    await aiService.addFaqToVectorStore(faq);

    // Populate user details
    await faq.populate('createdBy', 'firstName lastName email');

    res.status(201).json(faq);
  } catch (error: any) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { question, answer, isSuggested } = req.body;
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only agents can update FAQs
    if (user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can update FAQs' });
    }

    const faq = await FAQ.findOneAndUpdate(
      { _id: id, department: user.department },
      { 
        question, 
        answer, 
        isSuggested,
        updatedAt: new Date() 
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy', 'firstName lastName email');

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found or not in your department' });
    }

    res.json(faq);
  } catch (error: any) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
};

export const acceptSuggestedFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      { $set: { isSuggested: false } },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json(faq);
  } catch (error) {
    console.error('Error accepting suggested FAQ:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 
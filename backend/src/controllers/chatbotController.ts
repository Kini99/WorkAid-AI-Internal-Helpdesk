import { Request, Response } from 'express';
import ChatHistory from '../models/ChatHistory';
import { aiService } from '../services/ai.service';

export const handleChatbotQuestion = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Generate AI response
    const response = await aiService.generateResponse(question);

    // Save chat history
    const chatHistory = new ChatHistory({
      userId,
      question,
      response
    });
    await chatHistory.save();

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chatHistory = await ChatHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateChatFeedback = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { wasHelpful } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const chatHistory = await ChatHistory.findOneAndUpdate(
      { _id: chatId, userId },
      { wasHelpful },
      { new: true }
    );

    if (!chatHistory) {
      return res.status(404).json({ message: 'Chat history not found' });
    }

    return res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Update chat feedback error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 
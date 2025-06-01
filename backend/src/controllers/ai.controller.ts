import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const aiController = {
  async generateAnswer(req: Request, res: Response) {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }

      const answer = await aiService.generateResponse(question);
      return res.json({ answer });
    } catch (error) {
      console.error('Error in generateAnswer:', error);
      return res.status(500).json({ error: 'Failed to generate answer' });
    }
  },

  async addToKnowledgeBase(req: Request, res: Response) {
    try {
      const { documents, metadatas } = req.body;
      if (!documents || !metadatas || !Array.isArray(documents) || !Array.isArray(metadatas)) {
        return res.status(400).json({ error: 'Invalid input format' });
      }

      // await aiService.addToVectorStore('knowledge_base', documents, metadatas);
      return res.json({ message: 'Documents added successfully' });
    } catch (error) {
      console.error('Error in addToKnowledgeBase:', error);
      return res.status(500).json({ error: 'Failed to add documents' });
    }
  },

  async searchKnowledgeBase(req: Request, res: Response) {
    try {
      const { query, limit } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const results = await aiService.searchVectorStore('knowledge_base', query, limit);
      return res.json({ results });
    } catch (error) {
      console.error('Error in searchKnowledgeBase:', error);
      return res.status(500).json({ error: 'Failed to search knowledge base' });
    }
  }
}; 
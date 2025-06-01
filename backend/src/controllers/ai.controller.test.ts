import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/ai';
import { aiService } from '../services/ai.service';

jest.mock('../middleware/auth', () => ({
  auth: (req: any, res: any, next: any) => next()
}));

jest.mock('../services/ai.service');

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('AI Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate an AI answer', async () => {
    (aiService.generateResponse as jest.Mock).mockResolvedValue('Test AI answer');
    const res = await request(app)
      .post('/api/ai/answer')
      .send({ question: 'What is the HR policy?' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('Test AI answer');
  });

  it('should add documents to the knowledge base', async () => {
    (aiService.addToVectorStore as jest.Mock).mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/ai/knowledge-base')
      .send({ documents: ['doc1'], metadatas: [{}] });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Documents added successfully');
  });

  it('should search the knowledge base', async () => {
    (aiService.searchVectorStore as jest.Mock).mockResolvedValue({ results: ['doc1'] });
    const res = await request(app)
      .post('/api/ai/knowledge-base/search')
      .send({ query: 'policy', limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.results).toBeDefined();
  });
}); 
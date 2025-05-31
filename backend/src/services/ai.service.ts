import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient } from 'chromadb';
import { AI_CONFIG } from '../config/ai.config';
import { cacheService } from './cache.service';

class AIService {
  private genAI: GoogleGenerativeAI;
  private chromaClient: ChromaClient;

  constructor() {
    this.genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY);
    this.chromaClient = new ChromaClient({
      path: AI_CONFIG.CHROMA_DB_PATH
    });
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `response:${prompt}`;
      const cachedResponse = await cacheService.get<string>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Cache the response
      await cacheService.set(cacheKey, text);
      return text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async setupVectorStore(collectionName: string) {
    try {
      // Create or get collection
      const collection = await this.chromaClient.getOrCreateCollection({
        name: collectionName,
        metadata: {
          description: 'FAQ and knowledge base collection'
        }
      });
      return collection;
    } catch (error) {
      console.error('Error setting up vector store:', error);
      throw new Error('Failed to setup vector store');
    }
  }

  async addToVectorStore(collectionName: string, documents: string[], metadatas: any[]) {
    try {
      const collection = await this.setupVectorStore(collectionName);
      const ids = documents.map((_, i) => `doc_${i}`);
      
      await collection.add({
        ids,
        documents,
        metadatas
      });

      // Clear search cache when new documents are added
      await cacheService.delete(`search:${collectionName}`);
    } catch (error) {
      console.error('Error adding to vector store:', error);
      throw new Error('Failed to add documents to vector store');
    }
  }

  async searchVectorStore(collectionName: string, query: string, limit: number = 5) {
    try {
      // Check cache first
      const cacheKey = `search:${collectionName}:${query}:${limit}`;
      const cachedResults = await cacheService.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const collection = await this.setupVectorStore(collectionName);
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit
      });

      // Cache the results
      await cacheService.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching vector store:', error);
      throw new Error('Failed to search vector store');
    }
  }
}

export const aiService = new AIService(); 
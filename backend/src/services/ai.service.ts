import { GoogleGenerativeAI } from '@google/generative-ai';
import { Index } from '@upstash/vector';
import { AI_CONFIG } from '../config/ai.config';
import { cacheService } from './cache.service';
import { ITicket } from '../models/Ticket'; // Import ITicket
import { IFAQ } from '../models/FAQ'; // Import IFAQ

// Define a type for Vector DB query results (matching Upstash format)
export interface VectorQueryResult {
  id: string;
  score: number;
  metadata?: object | null;
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private vectorStore: Index;
  private policiesCollectionName = 'policies'; // Renamed for clarity
  private ticketsCollectionName = 'tickets'; // New collection name for tickets
  private faqsCollectionName = 'faqs'; // New collection name for FAQs

  constructor() {
    this.genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY);
    this.vectorStore = new Index({
      url: AI_CONFIG.UPSTASH_VECTOR_URL!,
      token: AI_CONFIG.UPSTASH_VECTOR_TOKEN!,
    });
    // Ensure collections are created on service initialization
    this.setupVectorStore(this.policiesCollectionName).catch(console.error);
    this.setupVectorStore(this.ticketsCollectionName).catch(console.error);
    this.setupVectorStore(this.faqsCollectionName).catch(console.error); // Setup faqs collection
    // TODO: Add logic to load existing FAQs into the 'faqs' collection on startup or via a script
  }

  async generateText(prompt: string): Promise<string> {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // 1 second

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        // Check if it's a service unavailability error
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          if (attempt < MAX_RETRIES - 1) {
            // Calculate delay with exponential backoff
            const delay = INITIAL_DELAY * Math.pow(2, attempt);
            console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        console.error('Error generating text with Gemini:', error);
        throw new Error('Failed to generate text');
      }
    }
    throw new Error('Failed to generate text after maximum retries');
  }

  async generateResponse(prompt: string): Promise<string> {
    const cacheKey = `response:${prompt}`;
    try {
      // Check cache first
      const cachedResponse = await cacheService.get<string>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      let context = '';
      let responseText = '';

      // 1. Search Vector DB (policies and faqs collections) for relevant information for RAG
      const policiesSearchResults = (await this.searchVectorStore(
        this.policiesCollectionName,
        prompt,
        5
      )) as VectorQueryResult[]; // Expect an array of results

      const faqsSearchResults = (await this.searchVectorStore(
        this.faqsCollectionName,
        prompt,
        5
      )) as VectorQueryResult[]; // Expect an array of results

      // Combine documents from both search results
      const combinedDocuments = [
        ...(policiesSearchResults || []).map((result) => (result.metadata as any)?.document || ''),
        ...(faqsSearchResults || []).map((result) => (result.metadata as any)?.document || ''),
      ].filter((doc) => doc);

      if (combinedDocuments.length > 0) {
        // 2. If relevant results found, build context and use RAG
        context = combinedDocuments.join('\n\n'); // Join relevant documents

        const ragPrompt = `Based on the following information, answer the user's question professionally and concisely. 
        In case you are given a greeting, politely respond with a greeting and then continue by asking what you can help the user with. If they ask what you can do, tell them you are a helpdesk agent and can assist with IT, HR and Admin related issues.
        If the information that you have does not contain the answer, state that you could not find relevant information in the provided context and suggest creating a ticket.\n\nInformation:\n${context}\n\nUser Question: ${prompt}\n\nAnswer:`;

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(ragPrompt);
        const response = await result.response;
        responseText = response.text();
      } else {
        // 4. If no relevant results found in either collection, return predefined message
        responseText =
          "It looks like I couldn't find a direct answer in our knowledge base. I recommend creating a ticket for an expert agent to help you?";
      }

      // Cache the response
      await cacheService.set(cacheKey, responseText);
      return responseText;
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback message in case of any error during RAG or search
      const fallbackMessage =
        'Sorry, I encountered an error while trying to find an answer. Please try again later or create a ticket for assistance.';
      // Still attempt to cache the error message to prevent repeated errors for the same prompt
      await cacheService.set(cacheKey, fallbackMessage); // cacheKey is now accessible
      throw new Error('Failed to generate AI response');
    }
  }

  async setupVectorStore(collectionName: string) {
    try {
      // In Upstash Vector, collections are created automatically when you first use them
      // No need for explicit creation
      return this.vectorStore;
    } catch (error) {
      console.error(`Error setting up vector store collection '${collectionName}':`, error);
      throw new Error(`Failed to setup vector store collection '${collectionName}'`);
    }
  }

  async addTicketToVectorStore(ticket: ITicket) {
    try {
      const documentContent = `${ticket.title} ${ticket.description}`;
      const metadata = {
        ticketId: ticket._id.toString(),
        department: ticket.department,
        createdAt: ticket.createdAt.toISOString(),
        document: documentContent,
      };

      // Embed and add the ticket content
      await this.vectorStore.upsert({
        id: ticket._id.toString(),
        vector: await this.getEmbedding(documentContent),
        metadata: metadata,
      });
    } catch (error) {
      console.error(`Error adding ticket ${ticket._id} to vector store:`, error);
    }
  }

  async addFaqToVectorStore(faq: IFAQ) {
    try {
      const documentContent = `${faq.question} ${faq.answer}`;
      const metadata = {
        faqId: faq._id.toString(),
        department: faq.department,
        createdAt: faq.createdAt.toISOString(),
        document: documentContent,
      };

      // Embed and add the FAQ content
      await this.vectorStore.upsert({
        id: faq._id.toString(),
        vector: await this.getEmbedding(documentContent),
        metadata: metadata,
      });
    } catch (error) {
      console.error(`Error adding FAQ ${faq._id} to vector store:`, error);
    }
  }

  async searchVectorStore(collectionName: string, query: string, limit: number = 5) {
    try {
      // Check cache first
      const searchCacheKey = `search:${collectionName}:${query}:${limit}`;
      const cachedResults = await cacheService.get<VectorQueryResult[]>(searchCacheKey);
      if (cachedResults) {
        return cachedResults;
      }

      const queryVector = await this.getEmbedding(query);

      const results = await this.vectorStore.query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
      });

      const mappedResults = results.map((result: any) => ({
        id: result.id,
        score: result.score,
        metadata: result.metadata,
        document: result.metadata?.document || '', // Ensure we have a document field
      })) as VectorQueryResult[];

      // Cache the results
      await cacheService.set(searchCacheKey, mappedResults);
      return mappedResults;
    } catch (error) {
      console.error(`Error searching vector store collection '${collectionName}':`, error);
      return [];
    }
  }

  public async getEmbedding(text: string): Promise<number[]> {
    // Implement your embedding logic here using Gemini or another embedding model
    // This is a placeholder - you'll need to implement the actual embedding logic
    const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  public async addToVectorStore(
    namespace: string,
    documents: string[],
    metadata: any[]
  ): Promise<void> {
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      const meta = metadata[i];
      const vector = await this.getEmbedding(document);
      await this.vectorStore.upsert({
        id: crypto.randomUUID(),
        vector,
        metadata: {
          ...meta,
          namespace, // Add namespace to metadata
          document, // *** ADD the document content to metadata ***
        },
      });
    }
  }
}

export const aiService = new AIService();

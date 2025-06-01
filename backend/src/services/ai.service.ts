import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient } from 'chromadb';
import { AI_CONFIG } from '../config/ai.config';
import { cacheService } from './cache.service';
import { ITicket } from '../models/Ticket'; // Import ITicket
import { IFAQ } from '../models/FAQ'; // Import IFAQ

// Define a type for ChromaDB query results to help with type checking
export interface ChromaQueryResult {
  ids: string[][];
  documents: string[][];
  metadatas: (object | null)[][];
  distances: number[][];
}

class AIService {
  private genAI: GoogleGenerativeAI;
  private chromaClient: ChromaClient;
  private policiesCollectionName = 'policies'; // Renamed for clarity
  private ticketsCollectionName = 'tickets'; // New collection name for tickets
  private faqsCollectionName = 'faqs'; // New collection name for FAQs

  constructor() {
    this.genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI_API_KEY);
    this.chromaClient = new ChromaClient({
      path: AI_CONFIG.CHROMA_DB_PATH
    });
    // Ensure collections are created on service initialization
    this.setupVectorStore(this.policiesCollectionName).catch(console.error);
    this.setupVectorStore(this.ticketsCollectionName).catch(console.error);
    this.setupVectorStore(this.faqsCollectionName).catch(console.error); // Setup faqs collection
    // TODO: Add logic to load existing FAQs into the 'faqs' collection on startup or via a script
  }

  async generateResponse(prompt: string): Promise<string> {
    let cacheKey = `response:${prompt}`; // Declare cacheKey outside try block
    try {
      // Check cache first
      const cachedResponse = await cacheService.get<string>(cacheKey);
      if (cachedResponse) {
        console.log('Returning cached response', cacheKey);
        return cachedResponse;
      }

      let context = '';
      let responseText = '';

      // 1. Search ChromaDB (policies and faqs collections) for relevant information for RAG
      const policiesSearchResults = await this.searchVectorStore(
        this.policiesCollectionName, // Search policies for RAG context
        prompt,
        5 // Limit results from policies
        ) as ChromaQueryResult; // Add type assertion

      const faqsSearchResults = await this.searchVectorStore(
        this.faqsCollectionName, // Search FAQs for RAG context
        prompt,
        5 // Limit results from FAQs
        ) as ChromaQueryResult; // Add type assertion

      // Log search results to inspect their structure
      console.log('ChromaDB policies search results:', JSON.stringify(policiesSearchResults, null, 2));
      console.log('ChromaDB FAQs search results:', JSON.stringify(faqsSearchResults, null, 2));

      // Combine documents from both search results
      const policiesDocuments = policiesSearchResults?.documents?.[0] || [];
      const faqsDocuments = faqsSearchResults?.documents?.[0] || [];
      const combinedDocuments = [...policiesDocuments, ...faqsDocuments];

      if (combinedDocuments.length > 0) {
        // 2. If relevant results found, build context and use RAG
        context = combinedDocuments.join('\n\n'); // Join relevant documents

        const ragPrompt = `Based on the following information, answer the user's question professionally and concisely. If the information does not contain the answer, state that you could not find relevant information in the provided context and suggest creating a ticket.\n\nInformation:\n${context}\n\nUser Question: ${prompt}\n\nAnswer:`;

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(ragPrompt);
        const response = await result.response;
        responseText = response.text();

      } else {
        // 4. If no relevant results found in either collection, return predefined message
        responseText = "It looks like I couldn't find a direct answer in our knowledge base. I recommend creating a ticket for an expert agent to help you?";
      }

      // Cache the response
      await cacheService.set(cacheKey, responseText);
      console.log('Cached new response', cacheKey);
      return responseText;

    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback message in case of any error during RAG or search
      const fallbackMessage = "Sorry, I encountered an error while trying to find an answer. Please try again later or create a ticket for assistance.";
       // Still attempt to cache the error message to prevent repeated errors for the same prompt
      await cacheService.set(cacheKey, fallbackMessage); // cacheKey is now accessible
      throw new Error('Failed to generate AI response');
    }
  }

  async setupVectorStore(collectionName: string) {
    try {
      // Create or get collection
      const collection = await this.chromaClient.getOrCreateCollection({
        name: collectionName,
        metadata: {
          description: `${collectionName} collection` // Dynamic description
        }
      });
      console.log(`Vector store collection '${collectionName}' ready.`);
      return collection;
    } catch (error) {
      console.error(`Error setting up vector store collection '${collectionName}':`, error);
      throw new Error(`Failed to setup vector store collection '${collectionName}'`);
    }
  }

   async addTicketToVectorStore(ticket: ITicket) {
    try {
      const collection = await this.setupVectorStore(this.ticketsCollectionName);
      const documentContent = `${ticket.title} ${ticket.description}`;
      const metadata = {
        ticketId: ticket._id.toString(), // Store MongoDB _id as metadata
        department: ticket.department,
        createdAt: ticket.createdAt.toISOString(),
      };

      // Embed and add the ticket content using its MongoDB _id as the Chroma ID
      await collection.add({
        ids: [ticket._id.toString()], // Use MongoDB _id as Chroma ID
        documents: [documentContent],
        metadatas: [metadata]
      });

      console.log(`Ticket ${ticket._id} added to '${this.ticketsCollectionName}' vector store.`);

    } catch (error) {
      console.error(`Error adding ticket ${ticket._id} to vector store:`, error);
      // Do not rethrow, allow ticket creation to succeed even if embedding fails
    }
  }

  async addFaqToVectorStore(faq: IFAQ) {
    try {
      const collection = await this.setupVectorStore(this.faqsCollectionName);
      const documentContent = `${faq.question} ${faq.answer}`;
      const metadata = {
        faqId: faq._id.toString(), // Store MongoDB _id as metadata
        department: faq.department,
        createdAt: faq.createdAt.toISOString(),
      };

      // Embed and add the FAQ content using its MongoDB _id as the Chroma ID
      await collection.add({
        ids: [faq._id.toString()], // Use MongoDB _id as Chroma ID
        documents: [documentContent],
        metadatas: [metadata]
      });

      console.log(`FAQ ${faq._id} added to '${this.faqsCollectionName}' vector store.`);

    } catch (error) {
      console.error(`Error adding FAQ ${faq._id} to vector store:`, error);
      // Do not rethrow, allow operation to succeed even if embedding fails
    }
  }

  async addToVectorStore(collectionName: string, documents: string[], metadatas: any[]) {
    try {
      const collection = await this.setupVectorStore(collectionName);
      const ids = documents.map((_, i) => `doc_${i}`); // Original logic for policy docs
      
      await collection.add({
        ids,
        documents,
        metadatas
      });

      // Clear search cache when new documents are added
      await cacheService.delete(`search:${collectionName}`);
      console.log(`${documents.length} documents added to '${collectionName}' vector store.`);
    } catch (error) {
      console.error(`Error adding documents to '${collectionName}' vector store:`, error);
      throw new Error(`Failed to add documents to '${collectionName}' vector store`);
    }
  }

  async searchVectorStore(collectionName: string, query: string, limit: number = 5) {
    try {
      // Check cache first - search cache uses a different key structure
      const searchCacheKey = `search:${collectionName}:${query}:${limit}`;
      const cachedResults = await cacheService.get(searchCacheKey);
      if (cachedResults) {
        console.log('Returning cached search results', searchCacheKey);
        // ChromaDB query results format is { ids, documents, metadatas, distances, embeddings, data }
        // Need to ensure cachedResults has this structure, or just return the documents
         // Assuming cachedResults stores the full results object
        return cachedResults; // Return cached results directly
      }

      const collection = await this.setupVectorStore(collectionName);
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit
      });

      // Cache the results - assuming results is the object returned by chromaClient.query
      await cacheService.set(searchCacheKey, results);
      console.log('Cached new search results', searchCacheKey);
      return results;
    } catch (error) {
      console.error(`Error searching vector store collection '${collectionName}':`, error);
      // Return empty results or rethrow based on desired error handling
      return { ids: [], documents: [], metadatas: [], distances: [] }; // Return empty structure on error
    }
  }
}

export const aiService = new AIService(); 
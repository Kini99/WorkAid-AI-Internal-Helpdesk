"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const vector_1 = require("@upstash/vector");
const ai_config_1 = require("../config/ai.config");
const cache_service_1 = require("./cache.service");
class AIService {
    constructor() {
        this.policiesCollectionName = 'policies'; // Renamed for clarity
        this.ticketsCollectionName = 'tickets'; // New collection name for tickets
        this.faqsCollectionName = 'faqs'; // New collection name for FAQs
        this.genAI = new generative_ai_1.GoogleGenerativeAI(ai_config_1.AI_CONFIG.GEMINI_API_KEY);
        this.vectorStore = new vector_1.Index({
            url: ai_config_1.AI_CONFIG.UPSTASH_VECTOR_URL,
            token: ai_config_1.AI_CONFIG.UPSTASH_VECTOR_TOKEN,
        });
        // Ensure collections are created on service initialization
        this.setupVectorStore(this.policiesCollectionName).catch(console.error);
        this.setupVectorStore(this.ticketsCollectionName).catch(console.error);
        this.setupVectorStore(this.faqsCollectionName).catch(console.error); // Setup faqs collection
        // TODO: Add logic to load existing FAQs into the 'faqs' collection on startup or via a script
    }
    generateText(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = yield model.generateContent(prompt);
                const response = yield result.response;
                return response.text();
            }
            catch (error) {
                console.error('Error generating text with Gemini:', error);
                throw new Error('Failed to generate text');
            }
        });
    }
    generateResponse(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `response:${prompt}`; // Changed to const since it's never reassigned
            try {
                // Check cache first
                const cachedResponse = yield cache_service_1.cacheService.get(cacheKey);
                if (cachedResponse) {
                    return cachedResponse;
                }
                let context = '';
                let responseText = '';
                // 1. Search Vector DB (policies and faqs collections) for relevant information for RAG
                const policiesSearchResults = yield this.searchVectorStore(this.policiesCollectionName, prompt, 5); // Expect an array of results
                const faqsSearchResults = yield this.searchVectorStore(this.faqsCollectionName, prompt, 5); // Expect an array of results
                // Combine documents from both search results
                const combinedDocuments = [
                    ...(policiesSearchResults || []).map(result => { var _a; return ((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.document) || ''; }),
                    ...(faqsSearchResults || []).map(result => { var _a; return ((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.document) || ''; }),
                ].filter(doc => doc);
                if (combinedDocuments.length > 0) {
                    // 2. If relevant results found, build context and use RAG
                    context = combinedDocuments.join('\n\n'); // Join relevant documents
                    const ragPrompt = `Based on the following information, answer the user's question professionally and concisely. If the information does not contain the answer, state that you could not find relevant information in the provided context and suggest creating a ticket.\n\nInformation:\n${context}\n\nUser Question: ${prompt}\n\nAnswer:`;
                    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    const result = yield model.generateContent(ragPrompt);
                    const response = yield result.response;
                    responseText = response.text();
                }
                else {
                    // 4. If no relevant results found in either collection, return predefined message
                    responseText = "It looks like I couldn't find a direct answer in our knowledge base. I recommend creating a ticket for an expert agent to help you?";
                }
                // Cache the response
                yield cache_service_1.cacheService.set(cacheKey, responseText);
                return responseText;
            }
            catch (error) {
                console.error('Error generating AI response:', error);
                // Fallback message in case of any error during RAG or search
                const fallbackMessage = "Sorry, I encountered an error while trying to find an answer. Please try again later or create a ticket for assistance.";
                // Still attempt to cache the error message to prevent repeated errors for the same prompt
                yield cache_service_1.cacheService.set(cacheKey, fallbackMessage); // cacheKey is now accessible
                throw new Error('Failed to generate AI response');
            }
        });
    }
    setupVectorStore(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // In Upstash Vector, collections are created automatically when you first use them
                // No need for explicit creation
                return this.vectorStore;
            }
            catch (error) {
                console.error(`Error setting up vector store collection '${collectionName}':`, error);
                throw new Error(`Failed to setup vector store collection '${collectionName}'`);
            }
        });
    }
    addTicketToVectorStore(ticket) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const documentContent = `${ticket.title} ${ticket.description}`;
                const metadata = {
                    ticketId: ticket._id.toString(),
                    department: ticket.department,
                    createdAt: ticket.createdAt.toISOString(),
                };
                // Embed and add the ticket content
                yield this.vectorStore.upsert({
                    id: ticket._id.toString(),
                    vector: yield this.getEmbedding(documentContent),
                    metadata: metadata
                });
            }
            catch (error) {
                console.error(`Error adding ticket ${ticket._id} to vector store:`, error);
            }
        });
    }
    addFaqToVectorStore(faq) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const documentContent = `${faq.question} ${faq.answer}`;
                const metadata = {
                    faqId: faq._id.toString(),
                    department: faq.department,
                    createdAt: faq.createdAt.toISOString(),
                };
                // Embed and add the FAQ content
                yield this.vectorStore.upsert({
                    id: faq._id.toString(),
                    vector: yield this.getEmbedding(documentContent),
                    metadata: metadata
                });
            }
            catch (error) {
                console.error(`Error adding FAQ ${faq._id} to vector store:`, error);
            }
        });
    }
    searchVectorStore(collectionName_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query, limit = 5) {
            try {
                // Check cache first
                const searchCacheKey = `search:${collectionName}:${query}:${limit}`;
                const cachedResults = yield cache_service_1.cacheService.get(searchCacheKey);
                if (cachedResults) {
                    return cachedResults;
                }
                const queryVector = yield this.getEmbedding(query);
                const results = yield this.vectorStore.query({
                    vector: queryVector,
                    topK: limit,
                    includeMetadata: true
                });
                // Cache the results
                yield cache_service_1.cacheService.set(searchCacheKey, results);
                return results.map((result) => ({
                    id: result.id,
                    score: result.score,
                    metadata: result.metadata,
                })); // Assert return type as array of VectorQueryResult
            }
            catch (error) {
                console.error(`Error searching vector store collection '${collectionName}':`, error);
                return []; // Return an empty array on error
            }
        });
    }
    getEmbedding(text) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implement your embedding logic here using Gemini or another embedding model
            // This is a placeholder - you'll need to implement the actual embedding logic
            const model = this.genAI.getGenerativeModel({ model: "embedding-001" });
            const result = yield model.embedContent(text);
            return result.embedding.values;
        });
    }
    addToVectorStore(namespace, documents, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < documents.length; i++) {
                const document = documents[i];
                const meta = metadata[i];
                const vector = yield this.getEmbedding(document);
                yield this.vectorStore.upsert({
                    id: crypto.randomUUID(),
                    vector,
                    metadata: Object.assign(Object.assign({}, meta), { namespace // Add namespace to metadata instead
                     })
                });
            }
        });
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();

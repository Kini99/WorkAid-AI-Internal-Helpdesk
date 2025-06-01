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
exports.aiController = void 0;
const ai_service_1 = require("../services/ai.service");
exports.aiController = {
    generateAnswer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { question } = req.body;
                if (!question) {
                    return res.status(400).json({ error: 'Question is required' });
                }
                const answer = yield ai_service_1.aiService.generateResponse(question);
                return res.json({ answer });
            }
            catch (error) {
                console.error('Error in generateAnswer:', error);
                return res.status(500).json({ error: 'Failed to generate answer' });
            }
        });
    },
    addToKnowledgeBase(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { documents, metadatas } = req.body;
                if (!documents || !metadatas || !Array.isArray(documents) || !Array.isArray(metadatas)) {
                    return res.status(400).json({ error: 'Invalid input format' });
                }
                // await aiService.addToVectorStore('knowledge_base', documents, metadatas);
                return res.json({ message: 'Documents added successfully' });
            }
            catch (error) {
                console.error('Error in addToKnowledgeBase:', error);
                return res.status(500).json({ error: 'Failed to add documents' });
            }
        });
    },
    searchKnowledgeBase(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query, limit } = req.body;
                if (!query) {
                    return res.status(400).json({ error: 'Search query is required' });
                }
                const results = yield ai_service_1.aiService.searchVectorStore('knowledge_base', query, limit);
                return res.json({ results });
            }
            catch (error) {
                console.error('Error in searchKnowledgeBase:', error);
                return res.status(500).json({ error: 'Failed to search knowledge base' });
            }
        });
    }
};

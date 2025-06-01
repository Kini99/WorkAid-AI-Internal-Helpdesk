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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChatFeedback = exports.getChatHistory = exports.handleChatbotQuestion = void 0;
const ChatHistory_1 = __importDefault(require("../models/ChatHistory"));
const ai_service_1 = require("../services/ai.service");
const handleChatbotQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { question } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!question) {
            return res.status(400).json({ message: 'Question is required' });
        }
        // Generate AI response
        const response = yield ai_service_1.aiService.generateResponse(question);
        // Save chat history
        const chatHistory = new ChatHistory_1.default({
            userId,
            question,
            response
        });
        yield chatHistory.save();
        return res.status(200).json({ response });
    }
    catch (error) {
        console.error('Chatbot error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.handleChatbotQuestion = handleChatbotQuestion;
const getChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chatHistory = yield ChatHistory_1.default.find({ userId })
            .sort({ timestamp: -1 })
            .limit(10);
        return res.status(200).json(chatHistory);
    }
    catch (error) {
        console.error('Get chat history error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getChatHistory = getChatHistory;
const updateChatFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { chatId } = req.params;
        const { wasHelpful } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const chatHistory = yield ChatHistory_1.default.findOneAndUpdate({ _id: chatId, userId }, { wasHelpful }, { new: true });
        if (!chatHistory) {
            return res.status(404).json({ message: 'Chat history not found' });
        }
        return res.status(200).json(chatHistory);
    }
    catch (error) {
        console.error('Update chat feedback error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateChatFeedback = updateChatFeedback;

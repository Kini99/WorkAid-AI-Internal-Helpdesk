"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbotController_1 = require("../controllers/chatbotController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.auth);
// Handle chatbot questions
router.post('/answer-bot', chatbotController_1.handleChatbotQuestion);
// Get chat history
router.get('/history', chatbotController_1.getChatHistory);
// Update chat feedback
router.put('/feedback/:chatId', chatbotController_1.updateChatFeedback);
exports.default = router;

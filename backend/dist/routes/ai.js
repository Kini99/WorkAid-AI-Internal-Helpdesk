"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_1 = require("../middleware/auth");
const aiBotController_1 = require("../controllers/aiBotController");
const router = (0, express_1.Router)();
// All AI routes require authentication
router.use(auth_1.auth);
// Generate AI response
router.post('/answer', ai_controller_1.aiController.generateAnswer);
// Knowledge base management
router.post('/knowledge-base', ai_controller_1.aiController.addToKnowledgeBase);
router.post('/knowledge-base/search', ai_controller_1.aiController.searchKnowledgeBase);
// Get AI-suggested reply for a ticket
router.post('/tickets/:ticketId/suggest-reply', aiBotController_1.suggestReply);
exports.default = router;

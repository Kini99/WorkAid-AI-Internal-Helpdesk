"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const faqController_1 = require("../controllers/faqController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.auth);
// Get FAQs for department (Accessible by authenticated users - both employee and agent)
router.get('/', faqController_1.getFaqs);
// Create new FAQ (Only accessible by agents)
router.post('/', (0, auth_1.requireRole)(['agent']), faqController_1.createFaq);
// Update FAQ (Only accessible by agents)
router.put('/:id', (0, auth_1.requireRole)(['agent']), faqController_1.updateFaq);
exports.default = router;

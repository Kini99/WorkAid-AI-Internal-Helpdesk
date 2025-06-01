"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketController_1 = require("../controllers/ticketController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.auth);
// Get tickets (filtered by role)
router.get('/', ticketController_1.getTickets);
// Create new ticket
router.post('/', ticketController_1.createTicket);
// Get ticket details
router.get('/:id', ticketController_1.getTicketDetails);
// Add reply to ticket
router.post('/:id/reply', ticketController_1.addReply);
// Update ticket status
router.put('/:id/status', ticketController_1.updateTicketStatus);
exports.default = router;

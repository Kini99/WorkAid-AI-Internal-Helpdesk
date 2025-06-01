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
exports.addReply = exports.getTicketDetails = exports.updateTicketStatus = exports.createTicket = exports.getTickets = void 0;
const Ticket_1 = require("../models/Ticket");
const User_1 = require("../models/User");
const aiRoutingService_1 = require("../services/aiRoutingService");
const ticketAnalysisService_1 = require("../services/ticketAnalysisService");
const getTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        let query = {};
        if (userRole === 'employee') {
            // Employees can only see their own tickets
            query = { createdBy: userId };
        }
        else if (userRole === 'agent') {
            // Agents can see tickets from their department. Fetch full user to get department.
            const user = (yield User_1.User.findById(userId));
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            query = { department: user.department };
        }
        const tickets = yield Ticket_1.Ticket.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'firstName lastName email');
        res.json(tickets);
    }
    catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
});
exports.getTickets = getTickets;
const createTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Get user's department for fallback and ticket creation
        const user = (yield User_1.User.findById(userId));
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Use AI to determine the appropriate department
        let department;
        try {
            department = yield (0, aiRoutingService_1.routeTicketWithAI)(title, description);
        }
        catch (error) {
            // Fallback to user's department if AI routing fails
            department = user.department;
        }
        const ticket = new Ticket_1.Ticket({
            title,
            description,
            department,
            createdBy: user._id,
            status: 'open',
        });
        yield ticket.save();
        (0, ticketAnalysisService_1.analyzeNewTicketForFAQ)(ticket);
        res.status(201).json(ticket);
    }
    catch (error) {
        console.error('Error in createTicket function:', error);
        res.status(500).json({ message: 'Failed to create ticket' });
    }
});
exports.createTicket = createTicket;
const updateTicketStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const user = (yield User_1.User.findById(userId));
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const ticket = (yield Ticket_1.Ticket.findById(id));
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Check permissions
        if (user.role === 'employee' &&
            ticket.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this ticket' });
        }
        else if (user.role === 'agent' && ticket.department !== user.department) {
            return res.status(403).json({ message: 'Not authorized to update this ticket' });
        }
        ticket.status = status;
        yield ticket.save();
        res.json(ticket);
    }
    catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.updateTicketStatus = updateTicketStatus;
const getTicketDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const user = (yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId).exec());
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const ticket = yield Ticket_1.Ticket.findById(id)
            .populate('createdBy', 'firstName lastName email')
            .populate('assignedTo', 'firstName lastName email')
            .populate('messages.sender', 'firstName lastName email');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Check permissions
        if (user.role === 'employee' && ticket.createdBy._id.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }
        if (user.role === 'agent' && ticket.department !== user.department) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }
        res.json(ticket);
    }
    catch (error) {
        console.error('Get ticket details error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getTicketDetails = getTicketDetails;
const addReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { content, isAISuggested = false } = req.body;
        const user = (yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId).exec());
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const ticket = yield Ticket_1.Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Check permissions
        if (user.role === 'employee' && ticket.createdBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
        }
        if (user.role === 'agent' && ticket.department !== user.department) {
            return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
        }
        // Add message to ticket
        const newMessage = {
            content,
            sender: user._id,
            isAISuggested,
            createdAt: new Date(),
        };
        ticket.messages.push(newMessage);
        // Update ticket status to in-progress if it was open
        if (ticket.status === 'open') {
            ticket.status = 'in-progress';
        }
        yield ticket.save();
        // Populate the new message's sender details
        yield ticket.populate('messages.sender', 'firstName lastName email');
        res.json(ticket);
    }
    catch (error) {
        console.error('Add reply error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.addReply = addReply;

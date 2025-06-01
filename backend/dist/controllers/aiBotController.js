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
exports.suggestReply = void 0;
const Ticket_1 = require("../models/Ticket");
const User_1 = require("../models/User");
const ai_1 = require("../services/ai");
const suggestReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { ticketId } = req.params;
        const user = yield User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'agent') {
            return res.status(403).json({ message: 'Only agents can get AI suggestions' });
        }
        const ticket = yield Ticket_1.Ticket.findById(ticketId)
            .populate('createdBy', 'firstName lastName email')
            .populate('messages.sender', 'firstName lastName email');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (ticket.department !== user.department) {
            return res.status(403).json({ message: 'Not authorized to access this ticket' });
        }
        // Generate AI-suggested reply
        const suggestedReply = yield (0, ai_1.generateAISuggestedReply)(ticket);
        // Return just the suggestion without adding it to the ticket
        res.json({ suggestedReply });
    }
    catch (error) {
        console.error('Suggest reply error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.suggestReply = suggestReply;

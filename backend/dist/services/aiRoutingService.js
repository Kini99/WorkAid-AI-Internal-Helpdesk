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
exports.routeTicketWithAI = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const DEPARTMENTS = ['it', 'hr', 'admin'];
const SYSTEM_PROMPT = `You are a ticket routing assistant. Your task is to analyze the ticket title and description and determine which department it should be routed to.
Available departments are: IT, HR, and Admin.

IT department handles:
- Technical issues
- Software problems
- Hardware problems
- Network issues
- System access
- Software installation
- Technical support

HR department handles:
- Employee benefits
- Payroll issues
- Leave requests
- Employee relations
- Workplace policies
- Training and development
- Recruitment

Admin department handles:
- Office supplies
- Facility management
- General inquiries
- Document requests
- Travel arrangements
- Administrative support
- General office management

Respond with ONLY the department name in lowercase (it, hr, or admin).`;
const routeTicketWithAI = (title, description) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `${SYSTEM_PROMPT}

Ticket Title: ${title}
Ticket Description: ${description}

Department:`;
        const result = yield model.generateContent(prompt);
        const response = yield result.response;
        const department = response.text().trim().toLowerCase();
        // Validate the response
        if (!DEPARTMENTS.includes(department)) {
            throw new Error('Invalid department returned by AI');
        }
        return department;
    }
    catch (error) {
        console.error('AI routing error:', error);
        throw new Error('Failed to route ticket with AI');
    }
});
exports.routeTicketWithAI = routeTicketWithAI;

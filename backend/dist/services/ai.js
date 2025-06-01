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
exports.generateAISuggestedReply = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const generateAISuggestedReply = (ticket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        // Create a prompt that includes the ticket context
        const prompt = `As an IT, HR and Admin helpdesk agent, provide a professional and helpful response to the following ticket:

Title: ${ticket.title}
Description: ${ticket.description}
Department: ${ticket.department}
Status: ${ticket.status}

Previous messages:
${ticket.messages.map(msg => {
            const sender = msg.sender;
            return `${sender.firstName} ${sender.lastName}: ${msg.content}`;
        }).join('\n')}

Please provide a concise, professional, and helpful response that addresses the user's concerns. Reply only with a greeting, a summary of your understanding of the issue, and a resolution or next steps. End the message with a polite closing. Skip adding a subject line, mentioning username or any other non relevant information.
In case the ticket is not related to IT, HR or Admin, please state that you are not able to help with this ticket and suggest reaching out to their manager if that is relevant or apologize for the inconvenience caused.`;
        const result = yield model.generateContent(prompt);
        const response = yield result.response;
        return response.text();
    }
    catch (error) {
        console.error('Error generating AI reply:', error);
        throw new Error('Failed to generate AI reply');
    }
});
exports.generateAISuggestedReply = generateAISuggestedReply;

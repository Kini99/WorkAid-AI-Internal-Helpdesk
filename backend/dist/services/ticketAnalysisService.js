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
exports.analyzeNewTicketForFAQ = void 0;
const FAQ_1 = require("../models/FAQ");
const Ticket_1 = require("../models/Ticket");
const ai_service_1 = require("./ai.service");
const SIMILARITY_THRESHOLD = 0.8;
const MIN_SIMILAR_TICKETS = 2;
const analyzeNewTicketForFAQ = (newTicket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Add the new ticket to the tickets vector store
        yield ai_service_1.aiService.addTicketToVectorStore(newTicket);
        // 2. Search the tickets collection in Upstash Vector for similar tickets
        const searchResults = (yield ai_service_1.aiService.searchVectorStore('tickets', // Search the tickets collection
        `${newTicket.title} ${newTicket.description}`, // Query with title and description
        100 // Increase limit to get potentially more results to filter
        ));
        // 3. Filter results by similarity threshold and then fetch corresponding tickets from MongoDB
        const similarTicketIds = [];
        // Filter results based on similarity score
        // searchResults is now an array of VectorQueryResult objects
        for (const result of searchResults || []) {
            if (result.score >= SIMILARITY_THRESHOLD) {
                similarTicketIds.push(result.id);
            }
        }
        const mongoDbIds = similarTicketIds.map((id) => id);
        const similarTickets = yield Ticket_1.Ticket.find({
            $and: [
                { _id: { $in: mongoDbIds } },
                { status: { $in: ['open', 'in-progress'] } },
                { department: newTicket.department },
                { _id: { $ne: newTicket._id } },
            ],
        })
            .populate('createdBy', 'firstName lastName email')
            .lean();
        // 4. Check if a pattern is detected
        if (similarTickets.length >= MIN_SIMILAR_TICKETS) {
            // Check if a similar suggested FAQ already exists
            const existingSuggestion = yield FAQ_1.FAQ.findOne({
                question: { $regex: new RegExp(newTicket.title, 'i') },
                isSuggested: true,
                department: newTicket.department,
            });
            if (existingSuggestion) {
                return;
            }
            // 5. Generate FAQ suggestion using AI
            const faqPrompt = `Based on the following tickets which seem to be about a recurring issue, suggest a concise FAQ answer that would help users resolve this problem.\n\nTickets:\n${similarTickets.map((t) => `- **${t.title}**: ${t.description}`).join('\n')}. Reply with only the answer.`;
            // Use the new generateText function to bypass RAG for FAQ generation
            const suggestedContent = yield ai_service_1.aiService.generateText(faqPrompt);
            const suggestedQuestion = newTicket.title;
            const suggestedAnswer = suggestedContent.trim();
            // 6. Create and save the suggested FAQ
            const creatorUser = yield Ticket_1.Ticket.findById(newTicket._id)
                .populate('createdBy', '_id')
                .select('createdBy')
                .lean();
            if (!(creatorUser === null || creatorUser === void 0 ? void 0 : creatorUser.createdBy)) {
                throw new Error('Could not find ticket creator');
            }
            const suggestedFAQ = new FAQ_1.FAQ({
                question: suggestedQuestion,
                answer: suggestedAnswer,
                department: newTicket.department,
                isSuggested: true,
                createdBy: creatorUser.createdBy._id,
                suggestedFromTickets: similarTickets.map(t => t._id),
            });
            yield suggestedFAQ.save();
        }
    }
    catch (error) {
        console.error('Error analyzing ticket for FAQ:', error);
    }
});
exports.analyzeNewTicketForFAQ = analyzeNewTicketForFAQ;

import { FAQ } from '../models/FAQ';
import { ITicket, Ticket } from '../models/Ticket';
import { aiService, VectorQueryResult } from './ai.service';

const SIMILARITY_THRESHOLD = 0.8;
const MIN_SIMILAR_TICKETS = 2;

export const analyzeNewTicketForFAQ = async (newTicket: ITicket) => {
  try {
    // 1. Add the new ticket to the tickets vector store
    await aiService.addTicketToVectorStore(newTicket);

    // 2. Search the tickets collection in Upstash Vector for similar tickets
    const searchResults = (await aiService.searchVectorStore(
      'tickets', // Search the tickets collection
      `${newTicket.title} ${newTicket.description}`, // Query with title and description
      100 // Increase limit to get potentially more results to filter
    )) as VectorQueryResult[];

    // 3. Filter results by similarity threshold and then fetch corresponding tickets from MongoDB
    const similarTicketIds: string[] = [];
    
    // Filter results based on similarity score
    // searchResults is now an array of VectorQueryResult objects
    for (const result of searchResults || []) {
      if (result.score >= SIMILARITY_THRESHOLD) {
        similarTicketIds.push(result.id);
      }
    }

    const mongoDbIds = similarTicketIds.map((id: string) => id);

    const similarTickets = await Ticket.find({
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
      const existingSuggestion = await FAQ.findOne({
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
      const suggestedContent = await aiService.generateText(faqPrompt);

      const suggestedQuestion = newTicket.title;
      const suggestedAnswer = suggestedContent.trim();

      // 6. Create and save the suggested FAQ
      const creatorUser = await Ticket.findById(newTicket._id)
        .populate('createdBy', '_id')
        .select('createdBy')
        .lean();

      if (!creatorUser?.createdBy) {
        throw new Error('Could not find ticket creator');
      }

      const suggestedFAQ = new FAQ({
        question: suggestedQuestion,
        answer: suggestedAnswer,
        department: newTicket.department,
        isSuggested: true,
        createdBy: creatorUser.createdBy._id,
        suggestedFromTickets: similarTickets.map(t => t._id),
      });

      await suggestedFAQ.save();
    }
  } catch (error) {
    console.error('Error analyzing ticket for FAQ:', error);
  }
};

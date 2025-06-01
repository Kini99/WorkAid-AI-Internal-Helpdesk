import { FAQ } from '../models/FAQ';
import { ITicket, Ticket } from '../models/Ticket';
import { aiService, ChromaQueryResult } from './ai.service';

const SIMILARITY_THRESHOLD = 0.8;
const MIN_SIMILAR_TICKETS = 2;

export const analyzeNewTicketForFAQ = async (newTicket: ITicket) => {
  try {
    // 1. Add the new ticket to the tickets vector store
    await aiService.addTicketToVectorStore(newTicket);

    // 2. Search the tickets collection in ChromaDB for similar tickets
    const searchResults = (await aiService.searchVectorStore(
      'tickets', // Search the tickets collection
      `${newTicket.title} ${newTicket.description}`, // Query with title and description
      100 // Increase limit to get potentially more results to filter
    )) as ChromaQueryResult; // Add type assertion

    // 3. Filter ChromaDB results by similarity threshold and then fetch corresponding tickets from MongoDB
    const similarTicketIds: string[] = [];
    const distances = searchResults?.distances?.[0] || [];
    const ids = searchResults?.ids?.[0] || [];

    // Filter IDs based on similarity threshold (distance <= 1 - threshold)
    for (let i = 0; i < ids.length; i++) {
      if (distances[i] <= 1 - SIMILARITY_THRESHOLD) {
        similarTicketIds.push(ids[i]);
      }
    }

    const mongoDbIds = similarTicketIds.map((id: string) => id); // These should be MongoDB _id strings

    const similarTickets = await Ticket.find({
      $and: [
        { _id: { $in: mongoDbIds } }, // Tickets found by Chroma (using MongoDB IDs)
        { status: { $in: ['open', 'in-progress'] } },
        { department: newTicket.department },
        { _id: { $ne: newTicket._id } }, // Exclude the new ticket itself
      ],
    })
      .populate('createdBy', 'firstName lastName email')
      .lean(); // Populate sender for context

    // Further filter by similarity score if needed, but Chroma's results are already ordered by distance (similarity)
    // We can assume the top N results are the most similar. The current searchVectorStore defaults to limit 5.
    // If we need more precise score-based filtering, we'd need to retrieve distances from searchResults

    // 4. Check if a pattern is detected
    if (similarTickets.length >= MIN_SIMILAR_TICKETS) {
      // Check if a similar suggested FAQ already exists
      const existingSuggestion = await FAQ.findOne({
        // Simple check: look for a suggested FAQ with a similar question based on the new ticket's title
        question: { $regex: new RegExp(newTicket.title, 'i') }, // Case-insensitive regex match
        isSuggested: true,
        department: newTicket.department,
      });

      if (existingSuggestion) {
        return; // Don't create a duplicate suggestion
      }

      // 5. Generate FAQ suggestion using AI
      const faqPrompt = `Based on the following tickets which seem to be about a recurring issue, suggest a concise FAQ answer that would help users resolve this problem.\n\nTickets:\n${similarTickets.map((t) => `- **${t.title}**: ${t.description}`).join('\n')}. Reply with only the answer.`;

      // Use aiService.generateResponse which now incorporates RAG from policies (though the prompt is about tickets)
      // We might need a separate AI function specifically for synthesizing FAQ from tickets if the current one relies heavily on policy context
      const suggestedContent = await aiService.generateResponse(faqPrompt);

      const suggestedQuestion = newTicket.title; // Fallback question
      const suggestedAnswer = suggestedContent.trim(); // Fallback answer

      // 6. Create and save the suggested FAQ
      // Need to determine the user who created the ticket to set createdBy for the suggested FAQ
      // For now, let's use the user who created the *new* ticket as the creator of the suggestion
      const creatorUser = await Ticket.findById(newTicket._id)
        .populate('createdBy', '_id')
        .select('createdBy')
        .lean();
      const createdBy = creatorUser?.createdBy?._id; // Assuming createdBy is populated correctly

      if (!createdBy) {
        console.error('Could not determine creator for suggested FAQ.');
        return; // Exit if we can't set creator
      }

      const suggestedFAQ = new FAQ({
        question: suggestedQuestion,
        answer: suggestedAnswer,
        department: newTicket.department,
        createdBy: createdBy, // Assign the user who created the triggering ticket
        isSuggested: true,
      });

      await suggestedFAQ.save();
    }
  } catch (error) {
    console.error('Error analyzing ticket for FAQ suggestion:', error);
  }
};

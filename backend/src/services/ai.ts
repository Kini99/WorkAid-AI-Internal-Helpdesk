import { ITicket } from '../models/Ticket';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IUser } from '../models/User';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateAISuggestedReply = async (ticket: ITicket): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a prompt that includes the ticket context
    const prompt = `As an helpdesk agent, provide a professional and helpful response to the following ticket:

Title: ${ticket.title}
Description: ${ticket.description}
Department: ${ticket.department}
Status: ${ticket.status}

Previous messages:
${ticket.messages.map(msg => {
  const sender = msg.sender as unknown as IUser;
  return `${sender.firstName} ${sender.lastName}: ${msg.content}`;
}).join('\n')}

Please provide a concise, professional, and helpful response that addresses the user's concerns. Reply only with a greeting, a summary of your understanding of the issue, and a resolution or next steps. End the message with a polite closing. Skip adding a subject line, mentioning username or any other non relevant information.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI reply:', error);
    throw new Error('Failed to generate AI reply');
  }
}; 
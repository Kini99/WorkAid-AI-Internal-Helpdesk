import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const DEPARTMENTS = ['it', 'hr', 'admin'] as const;
type Department = typeof DEPARTMENTS[number];

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

export const routeTicketWithAI = async (title: string, description: string): Promise<Department> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${SYSTEM_PROMPT}

Ticket Title: ${title}
Ticket Description: ${description}

Department:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const department = response.text().trim().toLowerCase();

    // Validate the response
    if (!DEPARTMENTS.includes(department as Department)) {
      throw new Error('Invalid department returned by AI');
    }

    return department as Department;
  } catch (error) {
    console.error('AI routing error:', error);
    throw new Error('Failed to route ticket with AI');
  }
}; 
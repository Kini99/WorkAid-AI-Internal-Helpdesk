# WorkAid-AI-Internal-Helpdesk

An AI-powered internal helpdesk system for managing employee queries directed toward IT, HR, and Admin departments. The system includes ticket management, separate user dashboards, and AI-powered features such as auto-routing, response suggestions, self-serve Q&A, and pattern detection for improving operational efficiency.

## 🚀 Features

### User Roles
- **Employees (Normal Users)**
  - Create and track tickets
  - View ticket status and history
  - Mark tickets as resolved
  - Chat with AI-powered helpdesk bot

- **Agents (Department Experts - IT, HR, Admin)**
  - Receive and manage department-specific tickets
  - Access AI-generated response suggestions
  - Reassign tickets between departments
  - Manage department FAQs

### AI-Powered Features
- **Auto Routing Engine**: Intelligent ticket routing to appropriate departments
- **Response Suggestion**: AI-generated reply suggestions for agents
- **Self-Serve Answer Bot**: Instant answers to common questions
- **Pattern Detection**: Identifies repetitive queries and suggests FAQs

### Ticket Management
- Comprehensive ticket tracking
- Multi-department support (IT, HR, Admin)
- Conversation threading
- Status tracking (Open, In Progress, Resolved)

## 🛠️ Tech Stack

### Backend
- **Framework**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based
- **AI Integration**: 
  - LangChain
  - Gemini 2.0 Flash
  - Chroma Vector Database

### Frontend
- **Framework**: React
- **Styling**: Tailwind CSS
- **State Management**: React Context/Redux

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Cloud Account (for Gemini API)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kini99/WorkAid-AI-Internal-Helpdesk.git
cd WorkAid-AI-Internal-Helpdesk
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd frontend
npm start
```

## 🔒 Authentication

The system uses JWT-based authentication with the following features:
- Email + Password login
- Role-based access (Employee/Agent)
- 15-day token expiration with auto-refresh
- Password requirements:
  - Minimum 8 characters
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character

## 🤖 AI Integration Details

### Auto Routing
- Uses LangChain with Gemini 2.0 Flash
- Chroma vector database for similarity matching
- Fallback to Admin department if routing is unclear

### Response Suggestions
- Context-aware reply generation
- Historical response learning
- Editable suggestions for agents

### Self-Serve Bot
- RAG-based question answering
- Chroma-indexed knowledge base
- Graceful fallback handling

### Pattern Detection
- Similarity threshold-based detection
- FAQ suggestion system
- Automatic knowledge base updates


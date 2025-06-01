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
  - Upstash Vector
  - Upstash Redis

### Frontend
- **Framework**: React
- **Styling**: Tailwind CSS
- **State Management**: React Context/Redux

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Cloud Account (for Gemini API)
- Upstash Account (for Vector Database and Redis)

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

Create a `.env` file in the `backend` directory and add the following variables:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
UPSTASH_VECTOR_URL=your_upstash_vector_url
UPSTASH_VECTOR_TOKEN=your_upstash_vector_token
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token
```

Create a `.env` file in the `frontend` directory and add the following variable:

```env
REACT_APP_API_URL=http://localhost:5000
```

4. Load initial data (Policies and FAQs):

Load policy documents:
```bash
cd backend
npm run load-policies
```

Load FAQs from MongoDB:
```bash
cd backend
npm run load-faqs
```

5. Start the development servers:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server
cd ../frontend
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
- Upstash Vector for similarity matching
- Fallback to Admin department if routing is unclear

### Response Suggestions
- Context-aware reply generation
- Historical response learning
- Editable suggestions for agents

### Self-Serve Bot
- RAG-based question answering
- Upstash Vector-indexed knowledge base
- Graceful fallback handling

### Pattern Detection
- Similarity threshold-based detection
- FAQ suggestion system
- Automatic knowledge base updates
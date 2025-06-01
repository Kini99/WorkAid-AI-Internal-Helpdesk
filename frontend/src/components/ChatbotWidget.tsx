import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreateTicketModal from './dashboard/CreateTicketModal';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
interface ChatMessage {
  id: string;
  question: string;
  response: string;
  timestamp: Date;
  wasHelpful?: boolean;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        credentials: "include",
      });
    response &&  setIsLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/chatbot/history`, {
        credentials: 'include'
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/chatbot/answer-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ question: inputValue })
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        question: inputValue,
        response: data.response,
        timestamp: new Date()
      }]);
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    navigate('/tickets/new');
  };

  const handleFeedback = async (messageId: string, wasHelpful: boolean) => {
    try {
      await fetch(`${API_URL}/api/ai/chatbot/feedback/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ wasHelpful })
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">You</p>
                  <p className="text-gray-700">{message.question}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">AI Assistant</p>
                  <p className="text-gray-700">{message.response}</p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleFeedback(message.id, true)}
                      className="text-xs text-green-600 hover:text-green-800"
                    >
                      Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, false)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Not Helpful
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Send'
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCreateTicket}
              className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-800"
            >
              Didn't help? Create a ticket
            </button>
          </form>
        </div>
      )}
          <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        onSuccess={fetchTickets}
      />
    </div>
  );
};

export default ChatbotWidget; 
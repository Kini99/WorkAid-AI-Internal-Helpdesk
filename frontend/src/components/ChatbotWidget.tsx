import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateTicketModal from "./dashboard/CreateTicketModal";
import { get, post } from '../services/api';

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
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    setIsHistoryLoading(true);
    setError(null);
    try {
      const data = await get<ChatMessage[]>('/api/ai/chatbot/history');
      const sortedMessages = data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setError("Failed to load chat history. Please try again.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await post<{ response: string }>('/api/ai/chatbot/answer-bot', { question: inputValue });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          question: inputValue,
          response: data.response,
          timestamp: new Date(),
        },
      ]);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = () => {
    setIsCreateTicketModalOpen(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open chatbot"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 h-[600px] flex flex-col">
          <div
            className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close chatbot"
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
            {isHistoryLoading ? (
              <div className="flex justify-center items-center h-full">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
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
              </div>
            ) : error ? (
              <div className="text-red-600 text-center p-4">{error}</div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      You
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {message.question}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      AI Assistant
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {message.response}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                  "Send"
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCreateTicket}
              className="mt-2 w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500"
            >
              Didn't help? Create a ticket
            </button>
          </form>
        </div>
      )}
      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        onSuccess={() => {
          setIsCreateTicketModalOpen(false);
          navigate("/tickets");
        }}
      />
    </div>
  );
};

export default ChatbotWidget;

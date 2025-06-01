import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface Message {
  content: string;
  sender: {
    firstName: string;
    lastName: string;
    email: string;
  };
  isAISuggested: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  department: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAISuggested, setIsAISuggested] = useState(false);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tickets/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch ticket details");
        }

        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/tickets/${id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: reply,
          isAISuggested: isAISuggested,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
      setReply("");
      setIsAISuggested(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    }
  };

  const handleStatusChange = async (
    newStatus: "open" | "in-progress" | "resolved"
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleGetAISuggestion = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/ai/tickets/${id}/suggest-reply`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI suggestion");
      }

      const data = await response.json();
      setReply(data.suggestedReply);
      setIsAISuggested(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get AI suggestion"
      );
    }
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReply(e.target.value);
    if (isAISuggested) {
      setIsAISuggested(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 lg:mx-16">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="lg:mx-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-gray-800 dark:text-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {ticket.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {ticket.description}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                ticket.status === "open"
                  ? "bg-yellow-100 text-yellow-800"
                  : ticket.status === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
              }`}
            >
              {ticket.status.toLocaleUpperCase()}
            </span>
            {user?.role === "employee" && ticket.status !== "resolved" && (
              <button
                onClick={() => handleStatusChange("resolved")}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
              >
                Mark Resolved
              </button>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>
            Created by: {ticket.createdBy.firstName} {ticket.createdBy.lastName}
          </p>
          <p>Department: {ticket.department.toLocaleUpperCase()}</p>
          <p>Created: {new Date(ticket.createdAt).toLocaleString("en-GB")}</p>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="lg:mx-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-gray-800 dark:text-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Conversation
        </h2>
        <div className="space-y-4">
          {ticket.messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${message.sender.email === user?.email ? "bg-blue-100 dark:bg-blue-900 ml-auto" : "bg-gray-100 dark:bg-gray-700 mr-auto"} max-w-[90%] text-gray-800 dark:text-gray-200`}
            >
              <p
                className={`text-sm font-medium ${message.sender.email === user?.email ? "text-blue-900 dark:text-blue-200" : "text-gray-900 dark:text-gray-100"}`}
              >
                {message.sender.firstName} {message.sender.lastName}
              </p>
              <p className="mt-1">{message.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {ticket.status !== "resolved" && (
        <div className="lg:mx-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-gray-800 dark:text-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Add Reply
          </h2>
          <form onSubmit={handleReply}>
            <textarea
              value={reply}
              onChange={handleReplyChange}
              placeholder="Type your reply here..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
            {user?.role === "agent" && (
              <button
                type="button"
                onClick={handleGetAISuggestion}
                className="text-blue-500 hover:text-blue-600 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Get AI Suggestion
              </button>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Send Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;

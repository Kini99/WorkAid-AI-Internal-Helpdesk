import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CreateTicketModal from "./CreateTicketModal";
import ChatbotWidget from "../ChatbotWidget";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface Ticket {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
}

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const filteredAndSortedTickets = tickets
    .filter(
      (ticket) => statusFilter === "all" || ticket.status === statusFilter
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        credentials: "include",
      });
      const data = await response.json();
      Array.isArray(data) && setTickets(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load tickets. Please try again later.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
        <button
          onClick={() => setIsCreateTicketModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Create New Ticket
        </button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
          className="border rounded-md px-3 py-2"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          Loading tickets...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">{error}</div>
      ) : filteredAndSortedTickets.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No tickets found. Create your first ticket!
        </div>
      ) : (
        <div className="divide-y">
          {filteredAndSortedTickets?.map((ticket) => (
            <div
              key={ticket._id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/tickets/${ticket._id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {ticket.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{ticket.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    ticket.status === "open"
                      ? "bg-yellow-100 text-yellow-800"
                      : ticket.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Created: {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        onSuccess={fetchTickets}
      />

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default EmployeeDashboard;

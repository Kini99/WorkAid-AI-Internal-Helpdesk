import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CreateTicketModal from "./CreateTicketModal";
import ChatbotWidget from "../../components/ChatbotWidget";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface Ticket {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  department: string;
}

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const ticketsPerPage = 5;

  const filteredAndSortedTickets = useMemo(
    () =>
      tickets
        .filter(
          (ticket) => statusFilter === "all" || ticket.status === statusFilter
        )
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortBy === "newest" ? dateB - dateA : dateA - dateB;
        }),
    [sortBy, statusFilter, tickets]
  );

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredAndSortedTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );
  const totalPages = Math.ceil(
    filteredAndSortedTickets.length / ticketsPerPage
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchFAQs();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        credentials: "include",
      });
      const data = await response.json();
      setIsLoading(false);
      Array.isArray(data) && setTickets(data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load tickets. Please try again later.");
      setIsLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/faqs`, {
        credentials: "include",
      });
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    }
  };

  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:mx-16">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              My Tickets
            </h1>
            <button
              onClick={() => setIsCreateTicketModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create New Ticket
            </button>
          </div>
          <div className="flex gap-4 mb-6 w-[100]">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-300">
                Loading tickets...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredAndSortedTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-300">
                No tickets found. Create your first ticket!
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {ticket.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                          ticket.status === "open"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : ticket.status === "in-progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {ticket.status.toLocaleUpperCase()}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Created: {new Date(ticket.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredAndSortedTickets.length > ticketsPerPage && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      currentPage < totalPages && paginate(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{" "}
                      <span className="font-medium">
                        {indexOfFirstTicket + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          indexOfLastTicket,
                          filteredAndSortedTickets.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredAndSortedTickets.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          currentPage > 1 && paginate(currentPage - 1)
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (number) => (
                          <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === number
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                          >
                            {number}
                          </button>
                        )
                      )}
                      <button
                        onClick={() =>
                          currentPage < totalPages && paginate(currentPage + 1)
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <CreateTicketModal
          isOpen={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          onSuccess={fetchTickets}
        />
      </div>
      <div className="mt-8 lg:mx-16">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {faqs.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left focus:outline-none"
                    aria-expanded={activeFaq === faq.id}
                    aria-controls={`faq-${faq.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {faq.question}
                      </h3>
                      <svg
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                          activeFaq === faq.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  <div
                    id={`faq-${faq.id}`}
                    className={`px-6 pb-4 pt-0 transition-all duration-300 ease-in-out overflow-hidden ${
                      activeFaq === faq.id
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                    aria-hidden={activeFaq !== faq.id}
                  >
                    <p className="text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No FAQs available at the moment.
            </div>
          )}
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default EmployeeDashboard;

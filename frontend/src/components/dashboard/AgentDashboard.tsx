import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
interface Ticket {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  department: string;
}

interface FAQ {
  _id: string;
  id: string;
  question: string;
  answer: string;
  department: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  isSuggested?: boolean;
}

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [suggestedFaqs, setSuggestedFaqs] = useState<FAQ[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isEditingFaq, setIsEditingFaq] = useState<string | null>(null);
  const [editingFaqData, setEditingFaqData] = useState<Partial<FAQ>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const ticketsPerPage = 5; // Items per page

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch tickets
      const ticketsResponse = await fetch(`${API_URL}/api/tickets`, {
        credentials: "include",
      });

      if (!ticketsResponse.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData);

      // Fetch FAQs
      const faqsResponse = await fetch(`${API_URL}/api/faqs`, {
        credentials: "include",
      });

      if (!faqsResponse.ok) {
        throw new Error("Failed to fetch FAQs");
      }

      const faqsData: FAQ[] = await faqsResponse.json();
      // Filter fetched FAQs into regular and suggested
      setFaqs(faqsData.filter((faq) => !faq.isSuggested));
      setSuggestedFaqs(faqsData.filter((faq) => faq.isSuggested));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tickets
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

  // Pagination Logic
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

  const handleFaqEdit = (faq: FAQ) => {
    setIsEditingFaq(faq.id);
    setEditingFaqData(faq);
  };

  const handleFaqUpdate = async (faqId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/faqs/${faqId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editingFaqData),
      });

      if (!response.ok) {
        throw new Error("Failed to update FAQ");
      }

      const updatedFaq: FAQ = await response.json();
      // Update either the regular or suggested FAQ list
      if (updatedFaq.isSuggested) {
        setSuggestedFaqs(
          suggestedFaqs.map((faq) => (faq.id === faqId ? updatedFaq : faq))
        );
      } else {
        setFaqs(faqs.map((faq) => (faq.id === faqId ? updatedFaq : faq)));
      }
      setIsEditingFaq(null);
      setEditingFaqData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update FAQ");
    }
  };

  const handleAddToFaqList = async (faq: FAQ) => {
    try {
      // Call the update endpoint to set isSuggested to false
      const response = await fetch(`${API_URL}/api/faqs/${faq._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ...faq, isSuggested: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to add FAQ to list");
      }

      const updatedFaq: FAQ = await response.json();
      // Remove from suggested list and add to regular list
      setSuggestedFaqs(
        suggestedFaqs.filter((suggested) => suggested._id !== updatedFaq._id)
      );
      setFaqs([...faqs, updatedFaq]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add FAQ to list"
      );
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

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:mx-16">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Department Tickets
            </h1>
          </div>
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
              className="border rounded-md px-3 py-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-300">
                Loading tickets...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredAndSortedTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-300">
                No tickets found in your department.
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
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
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
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
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
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      currentPage < totalPages && paginate(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Suggested FAQs
            </h2>
            {suggestedFaqs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">
                No suggested FAQs available.
              </p>
            ) : (
              <div className="space-y-4">
                {suggestedFaqs.map((faq) => (
                  <div
                    key={faq._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                      {faq.answer}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleAddToFaqList(faq)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-500 text-sm font-medium"
                      >
                        Add to FAQ List
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

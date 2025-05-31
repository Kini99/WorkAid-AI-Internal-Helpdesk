import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
interface Ticket {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  department: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  department: string;
}

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditingFaq, setIsEditingFaq] = useState<string | null>(null);
  const [editingFaqData, setEditingFaqData] = useState<Partial<FAQ>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tickets
        const ticketsResponse = await fetch(`${API_URL}/api/tickets`, {
          credentials: 'include',
        });

        if (!ticketsResponse.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const ticketsData = await ticketsResponse.json();
        console.log('tickets data', ticketsData)
        setTickets(ticketsData);

        // Fetch FAQs
        const faqsResponse = await fetch(`${API_URL}/api/faqs`, {
          credentials: 'include',
        });

        if (!faqsResponse.ok) {
          throw new Error('Failed to fetch FAQs');
        }

        const faqsData = await faqsResponse.json();
        setFaqs(faqsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort tickets
  const filteredAndSortedTickets = tickets
    .filter(ticket => statusFilter === 'all' || ticket.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleFaqEdit = (faq: FAQ) => {
    setIsEditingFaq(faq.id);
    setEditingFaqData(faq);
  };

  const handleFaqUpdate = async (faqId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/faqs/${faqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editingFaqData),
      });

      if (!response.ok) {
        throw new Error('Failed to update FAQ');
      }

      const updatedFaq = await response.json();
      setFaqs(faqs.map(faq => faq.id === faqId ? updatedFaq : faq));
      setIsEditingFaq(null);
      setEditingFaqData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update FAQ');
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Tickets */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Department Tickets</h1>
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
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="border rounded-md px-3 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow">
            {filteredAndSortedTickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found in your department.
              </div>
            ) : (
              <div className="divide-y">
                {filteredAndSortedTickets.map((ticket) => {console.log('check', ticket)
                  return   (
                  <div
                    key={ticket._id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{ticket.title}</h3>
                        <p className="text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - FAQs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Suggested FAQs</h2>
            {faqs.length === 0 ? (
              <p className="text-gray-500">No FAQs available.</p>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    {isEditingFaq === faq.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingFaqData.question || ''}
                          onChange={(e) => setEditingFaqData({ ...editingFaqData, question: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="Question"
                        />
                        <textarea
                          value={editingFaqData.answer || ''}
                          onChange={(e) => setEditingFaqData({ ...editingFaqData, answer: e.target.value })}
                          className="w-full border rounded-md px-3 py-2"
                          placeholder="Answer"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setIsEditingFaq(null);
                              setEditingFaqData({});
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleFaqUpdate(faq.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium">{faq.question}</h3>
                        <p className="text-gray-600 mt-1">{faq.answer}</p>
                        <button
                          onClick={() => handleFaqEdit(faq)}
                          className="text-blue-500 hover:text-blue-600 mt-2"
                        >
                          Edit
                        </button>
                      </>
                    )}
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
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { get, post, put, del } from '../../services/api';

interface Ticket {
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
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditingFaq, setIsEditingFaq] = useState<string | null>(null);
  const [editingFaqData, setEditingFaqData] = useState<Partial<FAQ>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch tickets and FAQs on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [ticketsData, faqsData] = await Promise.all([
          get<Ticket[]>('/api/tickets'),
          get<FAQ[]>('/api/faqs')
        ]);
        setTickets(ticketsData);
        setFaqs(faqsData);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      await put(`/api/tickets/${ticketId}/status`, { status: newStatus });
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      setError('Failed to update ticket status. Please try again.');
    }
  };

  // Handle FAQ edit
  const handleFaqEdit = (faq: FAQ) => {
    setIsEditingFaq(faq.id);
    setEditingFaqData({ 
      question: faq.question, 
      answer: faq.answer,
      department: user?.department || ''
    });
  };
  
  // Handle FAQ delete
  const handleDeleteFaq = async (faqId: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await del(`/api/faqs/${faqId}`);
        setFaqs(faqs.filter(faq => faq.id !== faqId));
      } catch (err) {
        console.error('Failed to delete FAQ:', err);
        setError('Failed to delete FAQ. Please try again.');
      }
    }
  };

  // Save FAQ changes
  const saveFaqChanges = async (faqId: string) => {
    try {
      let updatedFaq: FAQ;
      
      if (faqId === 'new') {
        // Create new FAQ
        const newFaq = await post<FAQ>('/api/faqs', {
          ...editingFaqData,
          department: user?.department || ''
        });
        setFaqs([newFaq, ...faqs]);
      } else {
        // Update existing FAQ
        updatedFaq = await put<FAQ>(`/api/faqs/${faqId}`, editingFaqData);
        setFaqs(faqs.map(faq => 
          faq.id === faqId ? { ...faq, ...updatedFaq } : faq
        ));
      }
      
      setIsEditingFaq(null);
      setEditingFaqData({});
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      setError('Failed to save FAQ. Please try again.');
    }
  };

  // Filter and sort tickets
  const filteredAndSortedTickets = tickets
    .filter(ticket => statusFilter === 'all' || ticket.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right font-bold"
          >
            &times;
          </button>
        </div>
      )}
      
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
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found in your department.
              </div>
            ) : (
              <div className="divide-y">
                {filteredAndSortedTickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{ticket.title}</h3>
                        <p className="text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value as any)}
                          className="border rounded-md px-2 py-1 text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - FAQs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Suggested FAQs</h2>
              <button
                onClick={() => {
                  setIsEditingFaq('new');
                  setEditingFaqData({});
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Add New
              </button>
            </div>

            <div className="space-y-4">
              {/* Add New FAQ Form */}
              {isEditingFaq === 'new' && (
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Add New FAQ</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingFaqData.question || ''}
                      onChange={(e) => setEditingFaqData({ ...editingFaqData, question: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Enter question"
                    />
                    <textarea
                      value={editingFaqData.answer || ''}
                      onChange={(e) => setEditingFaqData({ ...editingFaqData, answer: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                      placeholder="Enter answer"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsEditingFaq(null);
                          setEditingFaqData({});
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveFaqChanges('new')}
                        disabled={!editingFaqData.question || !editingFaqData.answer}
                        className={`px-3 py-1 text-sm rounded-md ${
                          !editingFaqData.question || !editingFaqData.answer
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Add FAQ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQs List */}
              {faqs.map((faq) => (
                <div key={faq.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {isEditingFaq === faq.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingFaqData.question || faq.question}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, question: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Question"
                      />
                      <textarea
                        value={editingFaqData.answer || faq.answer}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, answer: e.target.value })}
                        className="w-full border rounded-md px-3 py-2"
                        placeholder="Answer"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                          title="Delete FAQ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingFaq(null);
                              setEditingFaqData({});
                            }}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveFaqChanges(faq.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-medium text-gray-800">{faq.question}</h3>
                      <p className="text-gray-600 mt-1">{faq.answer}</p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => handleFaqEdit(faq)}
                          className="text-blue-500 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"
                          title="Edit FAQ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                          title="Delete FAQ"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

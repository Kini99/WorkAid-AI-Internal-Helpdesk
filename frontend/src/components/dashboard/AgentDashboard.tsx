import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
}

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditingFaq, setIsEditingFaq] = useState<string | null>(null);
  const [editingFaqData, setEditingFaqData] = useState<Partial<FAQ>>({});

  // TODO: Implement ticket fetching from API
  // TODO: Implement FAQ fetching from API
  // TODO: Implement sorting and filtering logic
  // TODO: Implement FAQ editing and submission

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
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tickets found in your department.
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 hover:bg-gray-50">
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
                className="text-blue-500 hover:text-blue-600"
              >
                Add New
              </button>
            </div>

            {/* FAQs List */}
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border rounded-lg p-4">
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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditingFaq(null);
                            setEditingFaqData({});
                          }}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement FAQ update
                            setIsEditingFaq(null);
                            setEditingFaqData({});
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-medium text-gray-800">{faq.question}</h3>
                      <p className="text-gray-600 mt-1">{faq.answer}</p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setIsEditingFaq(faq.id);
                            setEditingFaqData(faq);
                          }}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    </>
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
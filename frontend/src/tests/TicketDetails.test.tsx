import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import TicketDetails from '../components/tickets/TicketDetails';

// Mock fetch
global.fetch = jest.fn();

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));

const mockTicket = {
  id: '123',
  title: 'Test Ticket',
  description: 'Test Description',
  status: 'open',
  department: 'it',
  createdBy: {
    firstName: 'Test',
    lastName: 'Employee',
    email: 'test@example.com',
  },
  messages: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockEmployee = {
  id: '1',
  email: 'test@example.com',
  role: 'employee',
  department: 'it',
  firstName: 'Test',
  lastName: 'Employee',
};

const mockAgent = {
  id: '2',
  email: 'agent@example.com',
  role: 'agent',
  department: 'it',
  firstName: 'Test',
  lastName: 'Agent',
};

describe('TicketDetails', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render ticket details for employee', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTicket),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TicketDetails />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for ticket details to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Check ticket information
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('Created by: Test Employee')).toBeInTheDocument();
    expect(screen.getByText('Department: it')).toBeInTheDocument();

    // Check reply form
    expect(screen.getByPlaceholderText('Type your reply here...')).toBeInTheDocument();
    expect(screen.getByText('Send Reply')).toBeInTheDocument();
  });

  it('should render ticket details for agent with AI suggestion button', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTicket),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TicketDetails />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for ticket details to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Check AI suggestion button
    expect(screen.getByText('Get AI Suggestion')).toBeInTheDocument();
  });

  it('should handle reply submission', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTicket),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockTicket,
          messages: [
            {
              content: 'Test reply',
              sender: mockEmployee,
              isAISuggested: false,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        }),
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TicketDetails />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for ticket details to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Submit reply
    const replyInput = screen.getByPlaceholderText('Type your reply here...');
    fireEvent.change(replyInput, { target: { value: 'Test reply' } });
    fireEvent.click(screen.getByText('Send Reply'));

    // Check if reply was sent
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tickets/123/reply',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Test reply' }),
        })
      );
    });
  });

  it('should handle AI suggestion for agent', async () => {
    const mockTicketWithSuggestion = {
      ...mockTicket,
      messages: [
        {
          content: 'AI suggested reply',
          sender: mockAgent,
          isAISuggested: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTicket),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTicketWithSuggestion),
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TicketDetails />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for ticket details to load
    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });

    // Click AI suggestion button
    fireEvent.click(screen.getByText('Get AI Suggestion'));

    // Check if AI suggestion was requested
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/tickets/123/suggest-reply',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Check if AI suggestion was displayed
    await waitFor(() => {
      expect(screen.getByText('AI Suggested')).toBeInTheDocument();
    });
  });

  it('should handle error states', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <TicketDetails />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
}); 
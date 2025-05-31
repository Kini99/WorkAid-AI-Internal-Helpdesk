import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmployeeDashboard from '../EmployeeDashboard';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

describe('EmployeeDashboard', () => {
  const mockTickets = [
    {
      id: '1',
      title: 'Test Ticket 1',
      description: 'Description 1',
      status: 'open',
      createdAt: '2024-03-20T10:00:00Z',
    },
    {
      id: '2',
      title: 'Test Ticket 2',
      description: 'Description 2',
      status: 'in-progress',
      createdAt: '2024-03-19T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthProvider>
        {ui}
      </AuthProvider>
    );
  };

  it('should render loading state initially', () => {
    renderWithAuth(<EmployeeDashboard />);
    expect(screen.getByText('Loading tickets...')).toBeInTheDocument();
  });

  it('should render error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load tickets. Please try again later.')).toBeInTheDocument();
    });
  });

  it('should render tickets when fetch succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
      expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
    });
  });

  it('should filter tickets by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: /status/i }), {
      target: { value: 'in-progress' },
    });

    expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Ticket 1')).not.toBeInTheDocument();
  });

  it('should sort tickets by date', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });

    // Default sort is newest first
    const tickets = screen.getAllByRole('heading', { level: 3 });
    expect(tickets[0]).toHaveTextContent('Test Ticket 1');

    // Change to oldest first
    fireEvent.change(screen.getByRole('combobox', { name: /sort/i }), {
      target: { value: 'oldest' },
    });

    const sortedTickets = screen.getAllByRole('heading', { level: 3 });
    expect(sortedTickets[0]).toHaveTextContent('Test Ticket 2');
  });

  it('should open create ticket modal when button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create new ticket/i }));

    expect(screen.getByText('Create New Ticket')).toBeInTheDocument();
  });

  it('should show empty state when no tickets exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found. Create your first ticket!')).toBeInTheDocument();
    });
  });

  it('should refresh tickets after creating a new one', async () => {
    // Mock initial tickets fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTickets),
    });

    // Mock ticket creation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '3', title: 'New Ticket' }),
    });

    // Mock tickets refresh
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([...mockTickets, { id: '3', title: 'New Ticket' }]),
    });

    renderWithAuth(<EmployeeDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });

    // Open create ticket modal
    fireEvent.click(screen.getByRole('button', { name: /create new ticket/i }));

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'New Ticket' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'New ticket description' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    // Verify tickets were refreshed
    await waitFor(() => {
      expect(screen.getByText('New Ticket')).toBeInTheDocument();
    });
  });
}); 
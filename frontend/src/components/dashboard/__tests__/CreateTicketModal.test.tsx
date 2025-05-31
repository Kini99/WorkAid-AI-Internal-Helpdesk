import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTicketModal from '../CreateTicketModal';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

describe('CreateTicketModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

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

  it('should not render when isOpen is false', () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Create New Ticket')).not.toBeInTheDocument();
  });

  it('should render form when isOpen is true', () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Create New Ticket')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Ticket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show validation errors for empty fields', async () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Subject')).toBeInvalid();
      expect(screen.getByLabelText('Description')).toBeInvalid();
    });
  });

  it('should show validation error for short title', async () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Subject')).toBeInvalid();
    });
  });

  it('should show validation error for short description', async () => {
    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Description')).toBeInvalid();
    });
  });

  it('should submit form and call onSuccess when successful', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123', title: 'Test Ticket' }),
    });

    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Test Ticket' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'This is a test ticket description' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'Test Ticket',
          description: 'This is a test ticket description',
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error message when submission fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to create ticket'));

    renderWithAuth(
      <CreateTicketModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Test Ticket' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'This is a test ticket description' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create ticket. Please try again.')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 
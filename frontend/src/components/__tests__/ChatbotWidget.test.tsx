import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatbotWidget from '../ChatbotWidget';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

describe('ChatbotWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render chatbot button initially', () => {
    renderWithProviders(<ChatbotWidget />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should open chatbot when button is clicked', () => {
    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('should close chatbot when close button is clicked', () => {
    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
  });

  it('should send message and display response', async () => {
    const mockResponse = { response: 'This is a test response' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot

    const input = screen.getByPlaceholderText('Type your question...');
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
      expect(screen.getByText('This is a test response')).toBeInTheDocument();
    });
  });

  it('should handle error when sending message', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to send'));

    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot

    const input = screen.getByPlaceholderText('Type your question...');
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });
  });

  it('should navigate to create ticket page when CTA is clicked', () => {
    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot
    fireEvent.click(screen.getByText('Didn\'t help? Create a ticket'));
    expect(window.location.pathname).toBe('/tickets/new');
  });

  it('should load chat history when opened', async () => {
    const mockHistory = [
      {
        id: '1',
        question: 'Previous question',
        response: 'Previous response',
        timestamp: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    });

    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot

    await waitFor(() => {
      expect(screen.getByText('Previous question')).toBeInTheDocument();
      expect(screen.getByText('Previous response')).toBeInTheDocument();
    });
  });

  it('should handle feedback submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: 'Test response' }),
    });

    renderWithProviders(<ChatbotWidget />);
    fireEvent.click(screen.getByRole('button')); // Open chatbot

    const input = screen.getByPlaceholderText('Type your question...');
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    fireEvent.click(screen.getByText('Helpful'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chatbot/feedback/'),
        expect.any(Object)
      );
    });
  });
}); 
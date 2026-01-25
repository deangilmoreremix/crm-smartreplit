import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatbotWidget } from '../components/ChatbotWidget';
import { ChatbotProvider } from '../contexts/ChatbotContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { WhitelabelProvider } from '../contexts/WhitelabelContext';
import whitelabelConfig from '../../whitelabel.config';

// Mock the contexts
const mockTheme = {
  isDark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: '#3B82F6',
    secondary: '#6366F1',
  }
};

const MockProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WhitelabelProvider config={whitelabelConfig}>
    <ThemeProvider>
      <ChatbotProvider>
        {children}
      </ChatbotProvider>
    </ThemeProvider>
  </WhitelabelProvider>
);

describe('ChatbotWidget', () => {
  it('should render chatbot button when closed', () => {
    const { getByTestId } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    // Should show the floating action button
    const fabButton = getByTestId ? getByTestId('chatbot-fab') : null;
    // Note: Without proper testID setup, we'll check for accessibility
    expect(fabButton).toBeTruthy();
  });

  it('should open chatbot when FAB is pressed', async () => {
    const { getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    // Initially closed - welcome message should not be visible
    expect(queryByText(/Welcome/)).toBeNull();

    // Press the FAB to open chatbot
    const fabButton = getByText(''); // Empty text for icon-only button
    fireEvent.press(fabButton);

    // Should now show welcome message
    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });
  });

  it('should send message and receive response', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    // Open chatbot
    const fabButton = getByText(''); // FAB button
    fireEvent.press(fabButton);

    // Wait for chatbot to open
    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    // Find input and send button
    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText(''); // Send button (icon only)

    // Type a message
    fireEvent.changeText(input, 'How do contacts work?');

    // Send the message
    fireEvent.press(sendButton);

    // Should show user message
    expect(queryByText('How do contacts work?')).toBeTruthy();

    // Should receive bot response
    await waitFor(() => {
      expect(queryByText(/Contacts are your customer database/)).toBeTruthy();
    });
  });

  it('should handle contact creation question', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    // Open chatbot and send contact question
    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'How do I add a contact?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/To add a contact:/)).toBeTruthy();
      expect(queryByText(/1\. Tap the Contacts tab/)).toBeTruthy();
      expect(queryByText(/2\. Press the \+ button/)).toBeTruthy();
    });
  });

  it('should handle deal creation question', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    // Open chatbot and send deal question
    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'How to create a deal?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/To create a deal:/)).toBeTruthy();
      expect(queryByText(/1\. Go to Deals tab/)).toBeTruthy();
    });
  });

  it('should handle dashboard question', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'What is the dashboard?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/The Dashboard shows your key metrics/)).toBeTruthy();
    });
  });

  it('should handle settings question', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'How to change theme?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/To change theme:/)).toBeTruthy();
      expect(queryByText(/Go to Settings tab/)).toBeTruthy();
    });
  });

  it('should handle general help question', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'What can you help with?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/I can teach you about:/)).toBeTruthy();
      expect(queryByText(/Contacts/)).toBeTruthy();
      expect(queryByText(/Deals/)).toBeTruthy();
    });
  });

  it('should handle empty message', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    // Try to send empty message
    fireEvent.changeText(input, '   '); // Only spaces
    fireEvent.press(sendButton);

    // Should not add any new messages
    expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    // Should not have additional messages beyond welcome
  });

  it('should handle unknown questions with fallback', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <MockProviders>
        <ChatbotWidget />
      </MockProviders>
    );

    const fabButton = getByText('');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(queryByText(/Welcome.*CRM assistant/)).toBeTruthy();
    });

    const input = getByPlaceholderText('Ask about contacts, deals, dashboard...');
    const sendButton = getByText('');

    fireEvent.changeText(input, 'What is the meaning of life?');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(queryByText(/I can explain/)).toBeTruthy();
      expect(queryByText(/manage contacts/)).toBeTruthy();
    });
  });
});
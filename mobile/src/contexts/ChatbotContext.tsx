import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotContextType {
  messages: Message[];
  isOpen: boolean;
  sendMessage: (message: string) => Promise<void>;
  showChatbot: () => void;
  hideChatbot: () => void;
  clearMessages: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

// Chatbot response logic - rule-based system
const getChatbotResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();

  // Contacts
  if (lowerInput.includes('contact') || lowerInput.includes('contacts')) {
    if (lowerInput.includes('add') || lowerInput.includes('create')) {
      return 'To add a contact:\n1. Tap the Contacts tab\n2. Press the + button\n3. Fill in name, email, phone\n4. Add company info\n5. Tap Save\n\nYour contact will appear in the list!';
    }
    if (lowerInput.includes('search') || lowerInput.includes('find')) {
      return 'To search contacts:\n• Use the search bar at the top\n• Filter by company, tags, or date\n• Sort by name, date added, or last contacted\n• Tap a contact to view details';
    }
    return 'Contacts are your customer database. You can:\n• View all contacts in a list\n• Add new contacts with details\n• Search and filter contacts\n• Import from CSV files\n• Export contact data\n• View contact activity history';
  }

  // Deals
  if (lowerInput.includes('deal') || lowerInput.includes('deals')) {
    if (lowerInput.includes('add') || lowerInput.includes('create')) {
      return 'To create a deal:\n1. Go to Deals tab\n2. Tap + button\n3. Enter deal name and value\n4. Select contact and stage\n5. Add description and notes\n6. Set close date\n7. Save the deal';
    }
    if (lowerInput.includes('stage') || lowerInput.includes('pipeline')) {
      return 'Deal stages typically include:\n• Prospect - Initial contact\n• Qualification - Needs assessment\n• Proposal - Sent quote/proposal\n• Negotiation - Terms discussion\n• Closed Won - Deal completed\n• Closed Lost - Deal lost\n\nDrag deals between stages to update progress.';
    }
    return 'Deals track your sales pipeline:\n• Create deals with values and stages\n• Move deals through pipeline stages\n• Set and track close dates\n• Add notes, tasks, and reminders\n• View deal analytics and forecasts\n• Generate reports on pipeline health';
  }

  // Dashboard
  if (lowerInput.includes('dashboard')) {
    return 'The Dashboard shows your key metrics:\n• Overview cards show key metrics\n• Recent activity feed\n• Quick action buttons\n• Charts for deals and revenue\n• Upcoming tasks and appointments\n• Performance indicators\n\nCustomize it in Settings to show what matters most to you.';
  }

  // Settings
  if (
    lowerInput.includes('setting') ||
    lowerInput.includes('settings') ||
    lowerInput.includes('theme') ||
    lowerInput.includes('dark')
  ) {
    if (lowerInput.includes('theme') || lowerInput.includes('dark')) {
      return "To change theme:\n1. Go to Settings tab\n2. Find 'Appearance' section\n3. Toggle between Light and Dark mode\n4. Changes apply immediately\n\nDark mode reduces eye strain in low light.";
    }
    return 'Settings let you customize the app:\n• Profile: Update your information\n• Notifications: Control alerts and reminders\n• Appearance: Theme and display options\n• Privacy: Data sharing preferences\n• Sync: Data synchronization settings\n• Help: App tutorials and support';
  }

  // Authentication
  if (
    lowerInput.includes('login') ||
    lowerInput.includes('sign in') ||
    lowerInput.includes('password')
  ) {
    return "To sign in:\n1. Enter your email address\n2. Enter your password\n3. Tap 'Sign In' button\n\nForgot password? Tap 'Forgot Password' and enter your email for reset instructions.\n\nDon't have an account? Use 'Sign Up' to create one.";
  }

  // General help
  if (
    lowerInput.includes('help') ||
    lowerInput.includes('tutorial') ||
    lowerInput.includes('learn')
  ) {
    return "I can teach you about:\n\n📱 Contacts: Adding, searching, managing customers\n💰 Deals: Creating, tracking, pipeline management\n📊 Dashboard: Metrics, insights, quick actions\n⚙️ Settings: Customization, preferences, themes\n\nTry asking: 'How do contacts work?' or 'Tell me about deals'";
  }

  // Default responses
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return "Hello! I'm here to help you get the most of your CRM. What would you like to learn about today?";
  }

  if (lowerInput.includes('thank')) {
    return "You're welcome! I'm always here if you need help with contacts, deals, dashboard, or settings. Just ask! 😊";
  }

  // Fallback
  return "I'm here to help with your CRM! I can explain:\n• How to manage contacts\n• Creating and tracking deals\n• Using the dashboard\n• App settings and customization\n\nWhat specific feature would you like to learn about?";
};

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to SmartCRM assistant! I'm here to help you learn about contacts, deals, dashboard, and features. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = {
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get bot response
    const botResponse = getChatbotResponse(messageText);
    const botMessage: Message = {
      text: botResponse,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  const showChatbot = () => {
    setIsOpen(true);
  };

  const hideChatbot = () => {
    setIsOpen(false);
  };

  const clearMessages = () => {
    setMessages([
      {
        text: "Welcome to SmartCRM assistant! I'm here to help you learn about contacts, deals, dashboard, and features. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const value: ChatbotContextType = {
    messages,
    isOpen,
    sendMessage,
    showChatbot,
    hideChatbot,
    clearMessages,
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
};

export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

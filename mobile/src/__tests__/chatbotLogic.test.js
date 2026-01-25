// Simple unit test for chatbot logic without React Native dependencies
const getChatbotResponse = (input) => {
  // Contacts
  if (input.includes('contact') || input.includes('contacts')) {
    if (input.includes('add') || input.includes('create')) {
      return "To add a contact:\n1. Tap the Contacts tab\n2. Press the + button\n3. Fill in name, email, phone\n4. Add company info\n5. Tap Save\n\nYour contact will appear in the list!";
    }
    if (input.includes('search') || input.includes('find')) {
      return "To search contacts:\n• Use the search bar at the top\n• Filter by company, tags, or date\n• Sort by name, date added, or last contacted\n• Tap a contact to view details";
    }
    return "Contacts are your customer database. You can:\n• View all contacts in a list\n• Add new contacts with details\n• Search and filter contacts\n• Import from CSV files\n• Export contact data\n• View contact activity history";
  }

  // Deals
  if (input.includes('deal') || input.includes('deals')) {
    if (input.includes('add') || input.includes('create')) {
      return "To create a deal:\n1. Go to Deals tab\n2. Tap + button\n3. Enter deal name and value\n4. Select contact and stage\n5. Add description and notes\n6. Set close date\n7. Save the deal";
    }
    if (input.includes('stage') || input.includes('pipeline')) {
      return "Deal stages typically include:\n• Prospect - Initial contact\n• Qualification - Needs assessment\n• Proposal - Sent quote/proposal\n• Negotiation - Terms discussion\n• Closed Won - Deal completed\n• Closed Lost - Deal lost\n\nDrag deals between stages to update progress.";
    }
    return "Deals track your sales pipeline:\n• Create deals with values and stages\n• Move deals through pipeline stages\n• Set and track close dates\n• Add notes, tasks, and reminders\n• View deal analytics and forecasts\n• Generate reports on pipeline health";
  }

  // Dashboard
  if (input.includes('dashboard')) {
    return "The Dashboard shows your key metrics:\n• Overview cards show key metrics\n• Recent activity feed\n• Quick action buttons\n• Charts for deals and revenue\n• Upcoming tasks and appointments\n• Performance indicators\n\nCustomize it in Settings to show what matters most to you.";
  }

  // Settings
  if (input.includes('setting') || input.includes('settings')) {
    if (input.includes('theme') || input.includes('dark')) {
      return "To change theme:\n1. Go to Settings tab\n2. Find 'Appearance' section\n3. Toggle between Light and Dark mode\n4. Changes apply immediately\n\nDark mode reduces eye strain in low light.";
    }
    return "Settings let you customize the app:\n• Profile: Update your information\n• Notifications: Control alerts and reminders\n• Appearance: Theme and display options\n• Privacy: Data sharing preferences\n• Sync: Data synchronization settings\n• Help: App tutorials and support";
  }

  // Authentication
  if (input.includes('login') || input.includes('sign in') || input.includes('password')) {
    return "To sign in:\n1. Enter your email address\n2. Enter your password\n3. Tap 'Sign In' button\n\nForgot password? Tap 'Forgot Password' and enter your email for reset instructions.\n\nDon't have an account? Use 'Sign Up' to create one.";
  }

  // General help
  if (input.includes('help') || input.includes('tutorial') || input.includes('learn')) {
    return "I can teach you about:\n\n📱 Contacts: Adding, searching, managing customers\n💰 Deals: Creating, tracking, pipeline management\n📊 Dashboard: Metrics, insights, quick actions\n⚙️ Settings: Customization, preferences, themes\n\nTry asking: 'How do contacts work?' or 'Tell me about deals'";
  }

  // Default responses
  if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
    return "Hello! I'm here to help you get the most of your CRM. What would you like to learn about today?";
  }

  if (input.includes('thank')) {
    return "You're welcome! I'm always here if you need help with contacts, deals, dashboard, or settings. Just ask! 😊";
  }

  // Fallback
  return "I'm here to help with your CRM! I can explain:\n• How to manage contacts\n• Creating and tracking deals\n• Using the dashboard\n• App settings and customization\n\nWhat specific feature would you like to learn about?";
};

describe('Chatbot Logic Tests', () => {
  test('should respond to contact questions', () => {
    expect(getChatbotResponse('How do contacts work?')).toContain('Contacts are your customer database');
    expect(getChatbotResponse('How do I add a contact?')).toContain('To add a contact:');
    expect(getChatbotResponse('How to search contacts?')).toContain('To search contacts:');
  });

  test('should respond to deal questions', () => {
    expect(getChatbotResponse('Tell me about deals')).toContain('Deals track your sales pipeline');
    expect(getChatbotResponse('How to create a deal?')).toContain('To create a deal:');
    expect(getChatbotResponse('What are deal stages?')).toContain('Deal stages typically include:');
  });

  test('should respond to dashboard questions', () => {
    expect(getChatbotResponse('What is the dashboard?')).toContain('The Dashboard shows your key metrics');
  });

  test('should respond to settings questions', () => {
    expect(getChatbotResponse('How do settings work?')).toContain('Settings let you customize the app');
    expect(getChatbotResponse('How to change theme?')).toContain('To change theme:');
  });

  test('should respond to authentication questions', () => {
    expect(getChatbotResponse('How do I sign in?')).toContain('To sign in:');
  });

  test('should respond to general help questions', () => {
    expect(getChatbotResponse('What can you help with?')).toContain('I can teach you about:');
    expect(getChatbotResponse('I need help')).toContain('I can teach you about:');
  });

  test('should respond to greetings', () => {
    expect(getChatbotResponse('Hello')).toContain('Hello!');
    expect(getChatbotResponse('Hi there')).toContain('Hello!');
  });

  test('should respond to thank you', () => {
    expect(getChatbotResponse('Thank you')).toContain("You're welcome!");
  });

  test('should provide fallback response for unknown questions', () => {
    expect(getChatbotResponse('What is the meaning of life?')).toContain('I can explain');
    expect(getChatbotResponse('Random question')).toContain('What specific feature');
  });

  test('should handle case insensitive input', () => {
    expect(getChatbotResponse('CONTACTS')).toContain('Contacts are your customer database');
    expect(getChatbotResponse('DeAlS')).toContain('Deals track your sales pipeline');
    expect(getChatbotResponse('dashboard')).toContain('Dashboard shows your key metrics');
  });

  test('should handle partial matches', () => {
    expect(getChatbotResponse('contact management')).toContain('Contacts are your customer database');
    expect(getChatbotResponse('deal tracking')).toContain('Deals track your sales pipeline');
    expect(getChatbotResponse('setting preferences')).toContain('Settings let you customize');
  });
});
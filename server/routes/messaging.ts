import type { Express } from "express";

// In-memory storage for messaging (temporary until database schema is added)
interface MessageProvider {
  id: string;
  name: string;
  apiKey: string;
  costPerMessage: number;
  supportedFeatures: string[];
  status: 'active' | 'inactive' | 'error';
  deliveryRate: number;
  responseTime: number;
}

interface Message {
  id: string;
  content: string;
  recipient: string;
  provider: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
  gpt5Suggestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high';
}

interface MessagingStats {
  totalMessages: number;
  deliveredMessages: number;
  deliveryRate: number;
  averageResponseTime: number;
  totalCost: number;
  costPerMessage: number;
  activeProviders: number;
}

// Temporary in-memory storage
const messageProviders: MessageProvider[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    apiKey: '***masked***',
    costPerMessage: 0.0075,
    supportedFeatures: ['SMS', 'MMS', 'Voice'],
    status: 'active',
    deliveryRate: 0.98,
    responseTime: 2
  },
  {
    id: 'aws-sns',
    name: 'AWS SNS',
    apiKey: '***masked***',
    costPerMessage: 0.0065,
    supportedFeatures: ['SMS'],
    status: 'active',
    deliveryRate: 0.95,
    responseTime: 3
  }
];

const messages: Message[] = [
  {
    id: '1',
    content: 'Thank you for your interest in our product. Would you like to schedule a demo?',
    recipient: '+1234567890',
    provider: 'twilio',
    status: 'delivered',
    sentAt: new Date().toISOString(),
    gpt5Suggestions: ['Consider adding a specific time suggestion', 'Include a call-to-action'],
    sentiment: 'positive',
    priority: 'high'
  },
  {
    id: '2',
    content: 'Your order has been shipped and will arrive tomorrow.',
    recipient: '+1987654321',
    provider: 'aws-sns',
    status: 'sent',
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    sentiment: 'neutral',
    priority: 'medium'
  }
];

const messagingStats: MessagingStats = {
  totalMessages: 245,
  deliveredMessages: 238,
  deliveryRate: 0.971,
  averageResponseTime: 2.3,
  totalCost: 1.85,
  costPerMessage: 0.0076,
  activeProviders: 2
};

export function registerMessagingRoutes(app: Express): void {
  // Get all message providers
  app.get('/api/messaging/providers', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(messageProviders);
    } catch (error) {
      console.error('Error fetching message providers:', error);
      res.status(500).json({ error: 'Failed to fetch message providers' });
    }
  });

  // Get all messages
  app.get('/api/messaging/messages', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Get messaging stats
  app.get('/api/messaging/stats', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(messagingStats);
    } catch (error) {
      console.error('Error fetching messaging stats:', error);
      res.status(500).json({ error: 'Failed to fetch messaging stats' });
    }
  });

  // Send a message
  app.post('/api/messaging/send', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content, recipient, provider } = req.body;

      if (!content || !recipient || !provider) {
        return res.status(400).json({ error: 'Content, recipient, and provider are required' });
      }

      // Validate provider exists
      const providerExists = messageProviders.find(p => p.id === provider && p.status === 'active');
      if (!providerExists) {
        return res.status(400).json({ error: 'Invalid or inactive provider' });
      }

      const newMessage: Message = {
        id: crypto.randomUUID(),
        content,
        recipient,
        provider,
        status: 'sent',
        sentAt: new Date().toISOString(),
        priority: 'medium'
      };

      messages.push(newMessage);

      // Update stats
      messagingStats.totalMessages += 1;
      messagingStats.totalCost += providerExists.costPerMessage;

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Get a specific message
  app.get('/api/messaging/messages/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const messageId = req.params.id;
      const message = messages.find(m => m.id === messageId);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      res.json(message);
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  });

  // Update message status (for delivery confirmations)
  app.put('/api/messaging/messages/:id/status', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const messageId = req.params.id;
      const { status } = req.body;

      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) {
        return res.status(404).json({ error: 'Message not found' });
      }

      messages[messageIndex].status = status;

      // Update stats if message was delivered
      if (status === 'delivered') {
        messagingStats.deliveredMessages += 1;
        messagingStats.deliveryRate = messagingStats.deliveredMessages / messagingStats.totalMessages;
      }

      res.json(messages[messageIndex]);
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ error: 'Failed to update message status' });
    }
  });
}
import type { Express } from "express";

// In-memory storage for phone calls (temporary until database schema is added)
interface Call {
  id: string;
  caller: string;
  duration: number;
  status: 'completed' | 'missed' | 'ongoing' | 'voicemail';
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript?: string;
  recording?: string;
  gpt5Analysis?: {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    sentimentScore: number;
  };
}

interface PhoneStats {
  totalCalls: number;
  answeredCalls: number;
  averageCallDuration: number;
  callQuality: number;
  customerSatisfaction: number;
  aiAccuracy: number;
}

// Temporary in-memory storage
const calls: Call[] = [
  {
    id: '1',
    caller: '+1 (555) 123-4567',
    duration: 245,
    status: 'completed',
    sentiment: 'positive',
    transcript: 'Hello, I\'m calling about your product demo. I\'m very interested in learning more about your CRM solution.',
    recording: '/api/recordings/call-1.mp3',
    gpt5Analysis: {
      summary: 'Prospect is interested in product demo and wants to learn more about CRM capabilities.',
      keyPoints: ['Interested in product demo', 'Needs more information about CRM features'],
      actionItems: ['Schedule product demo', 'Send additional product information'],
      sentimentScore: 0.85
    }
  },
  {
    id: '2',
    caller: '+1 (555) 987-6543',
    duration: 0,
    status: 'missed',
    sentiment: 'neutral'
  }
];

const phoneStats: PhoneStats = {
  totalCalls: 47,
  answeredCalls: 42,
  averageCallDuration: 185,
  callQuality: 0.92,
  customerSatisfaction: 0.88,
  aiAccuracy: 0.94
};

export function registerPhoneRoutes(app: Express): void {
  // Get all calls for the authenticated user
  app.get('/api/phone/calls', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(calls);
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  // Get phone statistics
  app.get('/api/phone/stats', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(phoneStats);
    } catch (error) {
      console.error('Error fetching phone stats:', error);
      res.status(500).json({ error: 'Failed to fetch phone stats' });
    }
  });

  // Create a new call record
  app.post('/api/phone/calls', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { caller, duration, status, transcript } = req.body;

      if (!caller || status === undefined) {
        return res.status(400).json({ error: 'Caller and status are required' });
      }

      const newCall: Call = {
        id: crypto.randomUUID(),
        caller,
        duration: duration || 0,
        status,
        sentiment: 'neutral',
        transcript
      };

      calls.push(newCall);

      // Update stats
      phoneStats.totalCalls += 1;
      if (status === 'completed') {
        phoneStats.answeredCalls += 1;
      }

      res.status(201).json(newCall);
    } catch (error) {
      console.error('Error creating call:', error);
      res.status(500).json({ error: 'Failed to create call' });
    }
  });

  // Get a specific call
  app.get('/api/phone/calls/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const callId = req.params.id;
      const call = calls.find(c => c.id === callId);

      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      res.json(call);
    } catch (error) {
      console.error('Error fetching call:', error);
      res.status(500).json({ error: 'Failed to fetch call' });
    }
  });

  // Update a call
  app.put('/api/phone/calls/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const callId = req.params.id;
      const callIndex = calls.findIndex(c => c.id === callId);

      if (callIndex === -1) {
        return res.status(404).json({ error: 'Call not found' });
      }

      const updatedCall = {
        ...calls[callIndex],
        ...req.body
      };

      calls[callIndex] = updatedCall;
      res.json(updatedCall);
    } catch (error) {
      console.error('Error updating call:', error);
      res.status(500).json({ error: 'Failed to update call' });
    }
  });

  // Analyze call transcript
  app.post('/api/phone/calls/:id/analyze', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const callId = req.params.id;
      const callIndex = calls.findIndex(c => c.id === callId);

      if (callIndex === -1) {
        return res.status(404).json({ error: 'Call not found' });
      }

      const call = calls[callIndex];

      if (!call.transcript) {
        return res.status(400).json({ error: 'Call has no transcript to analyze' });
      }

      // Mock AI analysis
      const analysis = {
        summary: `Call analysis for ${call.caller}`,
        keyPoints: [
          'Customer expressed interest in product features',
          'Discussed pricing and implementation timeline',
          'Requested additional documentation'
        ],
        actionItems: [
          'Send product brochure',
          'Schedule follow-up call',
          'Prepare pricing proposal'
        ],
        sentimentScore: 0.75
      };

      call.gpt5Analysis = analysis;
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing call:', error);
      res.status(500).json({ error: 'Failed to analyze call' });
    }
  });

  // Start a call (WebRTC signaling would go here in production)
  app.post('/api/phone/calls/start', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { number, type } = req.body;

      if (!number) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      // In a real implementation, this would initiate a call via Twilio or similar
      // For now, just return success
      res.json({
        callId: crypto.randomUUID(),
        status: 'initiated',
        number,
        type: type || 'voice'
      });
    } catch (error) {
      console.error('Error starting call:', error);
      res.status(500).json({ error: 'Failed to start call' });
    }
  });
}

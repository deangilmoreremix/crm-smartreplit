import type { Express } from "express";

// In-memory storage for appointments (temporary until database schema is added)
interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  attendees: string[];
  type: 'meeting' | 'call' | 'video' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  gpt5Insights?: {
    optimalTime: string;
    preparationNotes: string[];
    followUpActions: string[];
  };
}

interface MeetingStats {
  totalMeetings: number;
  completedToday: number;
  upcomingToday: number;
  averageDuration: number;
  successRate: number;
}

// Temporary in-memory storage
const appointments: Appointment[] = [
  {
    id: '1',
    title: 'Product Demo with Acme Corp',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: 60,
    attendees: ['john@acme.com', 'sarah@acme.com'],
    type: 'video',
    status: 'scheduled',
    priority: 'high',
    notes: 'Demo of new CRM features',
    gpt5Insights: {
      optimalTime: '10:00 AM',
      preparationNotes: ['Review product specs', 'Prepare demo script'],
      followUpActions: ['Send follow-up email', 'Schedule technical review']
    }
  },
  {
    id: '2',
    title: 'Team Standup',
    date: '2024-01-15',
    time: '2:00 PM',
    duration: 30,
    attendees: ['team@company.com'],
    type: 'meeting',
    status: 'scheduled',
    priority: 'medium',
    notes: 'Daily team sync'
  }
];

const meetingStats: MeetingStats = {
  totalMeetings: 24,
  completedToday: 3,
  upcomingToday: 5,
  averageDuration: 45,
  successRate: 0.85
};

export function registerAppointmentRoutes(app: Express): void {
  // Get all appointments for the authenticated user
  app.get('/api/appointments', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: 'Failed to fetch appointments' });
    }
  });

  // Get appointment statistics
  app.get('/api/appointments/stats', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(meetingStats);
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      res.status(500).json({ error: 'Failed to fetch appointment stats' });
    }
  });

  // Create a new appointment
  app.post('/api/appointments', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, date, time, duration, attendees, type, priority, notes } = req.body;

      if (!title || !date || !time) {
        return res.status(400).json({ error: 'Title, date, and time are required' });
      }

      const newAppointment: Appointment = {
        id: crypto.randomUUID(),
        title,
        date,
        time,
        duration: duration || 60,
        attendees: attendees || [],
        type: type || 'meeting',
        status: 'scheduled',
        priority: priority || 'medium',
        notes
      };

      appointments.push(newAppointment);

      // Update stats
      meetingStats.totalMeetings += 1;
      meetingStats.upcomingToday += 1;

      res.status(201).json(newAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  });

  // Get a specific appointment
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = req.params.id;
      const appointment = appointments.find(a => a.id === appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      res.status(500).json({ error: 'Failed to fetch appointment' });
    }
  });

  // Update an appointment
  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = req.params.id;
      const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);

      if (appointmentIndex === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const updatedAppointment = {
        ...appointments[appointmentIndex],
        ...req.body
      };

      appointments[appointmentIndex] = updatedAppointment;
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  });

  // Delete an appointment
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointmentId = req.params.id;
      const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);

      if (appointmentIndex === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      appointments.splice(appointmentIndex, 1);

      // Update stats
      meetingStats.totalMeetings -= 1;

      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  });

  // Generate AI insights for appointment
  app.post('/api/appointments/generate-insights', async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, attendees, type, duration } = req.body;

      // Mock AI insights generation
      const insights = {
        optimalTime: '10:00 AM',
        preparationNotes: [
          'Review attendee profiles and previous interactions',
          'Prepare agenda and key discussion points',
          'Have relevant materials ready for reference'
        ],
        followUpActions: [
          'Send meeting summary and action items',
          'Schedule follow-up if needed',
          'Update CRM with meeting outcomes'
        ]
      };

      res.json(insights);
    } catch (error) {
      console.error('Error generating appointment insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });
}

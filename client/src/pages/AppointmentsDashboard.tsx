import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Video,
  MapPin,
  Phone,
  MessageSquare,
  Brain,
  Target
} from 'lucide-react';

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

export default function AppointmentsDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [gpt5Suggestions, setGpt5Suggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data - in real app, this would come from API
  const mockAppointments: Appointment[] = [
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

  const mockStats: MeetingStats = {
    totalMeetings: 24,
    completedToday: 3,
    upcomingToday: 5,
    averageDuration: 45,
    successRate: 0.85
  };

  // Fetch appointments data
  const { data: appointments = mockAppointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    refetchInterval: 30000,
  });

  const { data: stats = mockStats, isLoading: statsLoading } = useQuery<MeetingStats>({
    queryKey: ['/api/appointments/stats'],
    refetchInterval: 30000,
  });

  const generateMeetingInsights = async (appointment: Partial<Appointment>) => {
    setIsGenerating(true);
    try {
      const prompt = `Generate meeting preparation insights for:
Title: ${appointment.title}
Attendees: ${appointment.attendees?.join(', ')}
Type: ${appointment.type}
Duration: ${appointment.duration} minutes

Provide optimal timing, preparation notes, and follow-up actions.`;

      const response = await gpt5Communication.generateContent({
        type: 'meeting-summary',
        context: prompt,
        goal: 'meeting-preparation'
      });

      setGpt5Suggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to generate meeting insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="create"
      onClick={() => setShowCreateModal(true)}
      className="bg-blue-600 hover:bg-blue-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Schedule Meeting
    </Button>,
    <Button
      key="ai-insights"
      variant="outline"
      onClick={() => generateMeetingInsights({ title: 'General Meeting' })}
      disabled={isGenerating}
    >
      <Brain className="h-4 w-4 mr-2" />
      {isGenerating ? 'Generating...' : 'AI Insights'}
    </Button>
  ];

  const headerStats = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalMeetings}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Meetings</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Completed Today</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.upcomingToday}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Today</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.successRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
      </div>
    </div>
  );

  return (
    <CommunicationDashboard
      appName="AI Smart Calendar Hub"
      appDescription="Intelligent meeting scheduling with AI-powered insights, automated summaries, and smart conflict resolution"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments
                  .filter(apt => apt.date === new Date().toISOString().split('T')[0])
                  .map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center gap-3">
                        {getTypeIcon(appointment.type)}
                        <div>
                          <h4 className="font-medium">{appointment.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {appointment.time} • {appointment.duration}min • {appointment.attendees.length} attendees
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(appointment.priority)}>
                          {appointment.priority}
                        </Badge>
                        <Badge variant="outline">
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {gpt5Suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Meeting Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gpt5Suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar className="h-16 w-16 mx-auto mb-4" />
                <p>Interactive calendar view coming soon...</p>
                <p className="text-sm mt-2">Full calendar integration with drag-and-drop scheduling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimal Meeting Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">9:00 AM - 11:00 AM</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">2:00 PM - 4:00 PM</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">4:00 PM - 5:00 PM</span>
                    <Badge className="bg-red-100 text-red-800">Low</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Meeting Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Duration</span>
                    <span className="font-medium">{stats.averageDuration}min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On-Time Rate</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Follow-up Rate</span>
                    <span className="font-medium text-blue-600">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                <p>Advanced analytics dashboard coming soon...</p>
                <p className="text-sm mt-2">Performance metrics, trends, and optimization insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Schedule New Meeting
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input id="title" placeholder="Enter meeting title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Meeting Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">In-Person Meeting</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" type="number" placeholder="60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees</Label>
              <Input id="attendees" placeholder="Enter email addresses (comma separated)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Meeting agenda and notes" rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Schedule with AI
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CommunicationDashboard>
  );
}
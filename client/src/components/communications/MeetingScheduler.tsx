import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Users,
  Video,
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Copy,
  Link,
  Bell,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { Contact } from '../../types/contact';

interface Meeting {
  id: string;
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  startTime: Date;
  endTime: Date;
  type: 'video' | 'phone' | 'in-person';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  reminder: number; // minutes before meeting
  notes: string;
  createdAt: Date;
  createdBy: string;
  attendees: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  meetingId?: string;
  meetingTitle?: string;
}

const MeetingScheduler: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Product Demo',
      description: 'Demo of our new features and capabilities',
      contactId: '1',
      contactName: 'John Smith',
      contactEmail: 'john@example.com',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
      type: 'video',
      meetingLink: 'https://meet.example.com/demo-123',
      status: 'confirmed',
      reminder: 15,
      notes: 'Prepare product demo slides',
      createdAt: new Date(),
      createdBy: 'Current User',
      attendees: ['john@example.com'],
      isRecurring: false
    },
    {
      id: '2',
      title: 'Sales Call',
      description: 'Follow-up sales discussion',
      contactId: '2',
      contactName: 'Jane Wilson',
      contactEmail: 'jane@example.com',
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 mins
      type: 'phone',
      status: 'scheduled',
      reminder: 30,
      notes: 'Discuss pricing and contract terms',
      createdAt: new Date(),
      createdBy: 'Current User',
      attendees: ['jane@example.com'],
      isRecurring: false
    }
  ]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Generate time slots for the week view
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if there's a meeting at this time
        const meetingAtTime = meetings.find(meeting => {
          const meetingHour = meeting.startTime.getHours();
          const meetingMinute = meeting.startTime.getMinutes();
          return meetingHour === hour && Math.floor(meetingMinute / 30) * 30 === minute;
        });

        slots.push({
          time: timeString,
          available: !meetingAtTime,
          meetingId: meetingAtTime?.id,
          meetingTitle: meetingAtTime?.title
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'no-show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'in-person':
        return <MapPin className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const updateMeetingStatus = (meetingId: string, newStatus: Meeting['status']) => {
    setMeetings(prev =>
      prev.map(meeting =>
        meeting.id === meetingId
          ? { ...meeting, status: newStatus }
          : meeting
      )
    );
  };

  const deleteMeeting = (meetingId: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    }
  };

  const generateMeetingLink = () => {
    return `https://meet.example.com/meeting-${Date.now()}`;
  };

  const sendCalendarInvite = (meeting: Meeting) => {
    console.log('Sending calendar invite for:', meeting.title);
    alert(`Calendar invite sent to ${meeting.contactEmail}`);
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meeting Scheduler</h2>
          <p className="text-gray-600 mt-1">Schedule and manage your meetings</p>
        </div>
        <button
          onClick={() => setShowCreateMeeting(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Schedule Meeting
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft size={20} />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `Week of ${formatDate(weekDays[0])}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h3>
            
            <button
              onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Month
              </button>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'week' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-8 gap-0 border-b border-gray-200">
            <div className="p-4 text-sm font-medium text-gray-600">Time</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-4 text-center border-l border-gray-200">
                <div className="text-sm font-medium text-gray-900">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-sm text-gray-600">{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {timeSlots.map((slot, index) => (
              <div key={index} className="grid grid-cols-8 gap-0 border-b border-gray-100 hover:bg-gray-50">
                <div className="p-3 text-xs text-gray-600 border-r border-gray-200">
                  {slot.time}
                </div>
                {weekDays.map((day, dayIndex) => (
                  <div key={dayIndex} className="p-2 border-l border-gray-200 min-h-[3rem]">
                    {/* Meeting blocks would be rendered here based on the day and time */}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 text-center">Month view calendar would be implemented here</p>
        </div>
      )}

      {/* Upcoming Meetings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Meetings</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredMeetings.map((meeting) => (
            <div key={meeting.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(meeting.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{meeting.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{meeting.description}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{meeting.contactName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(meeting.startTime)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                      </div>

                      {meeting.meetingLink && (
                        <div className="flex items-center space-x-1">
                          <Link className="h-4 w-4" />
                          <span>Meeting Link</span>
                        </div>
                      )}
                    </div>

                    {meeting.notes && (
                      <p className="text-gray-700 mt-3 text-sm">{meeting.notes}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {meeting.status === 'scheduled' && (
                    <button
                      onClick={() => updateMeetingStatus(meeting.id, 'confirmed')}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Confirm
                    </button>
                  )}
                  
                  {meeting.meetingLink && (
                    <button
                      onClick={() => navigator.clipboard.writeText(meeting.meetingLink!)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy Link
                    </button>
                  )}
                  
                  <button
                    onClick={() => sendCalendarInvite(meeting)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-md transition-colors"
                  >
                    <Send size={14} className="mr-1" />
                    Send Invite
                  </button>
                  
                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteMeeting(meeting.id)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Schedule your first meeting to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Meeting Modal */}
      {(showCreateMeeting || selectedMeeting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateMeeting(false);
                  setSelectedMeeting(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Meeting scheduling form would be implemented here with fields for title, contact, date/time, type, and other details.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateMeeting(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateMeeting(false);
                  setSelectedMeeting(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {selectedMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;

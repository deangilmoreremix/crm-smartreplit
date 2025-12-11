import React, { useState, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Clock, 
  User, 
  Calendar,
  Play,
  Square,
  Mic,
  MicOff,
  Star,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileAudio,
  Timer,
  Target
} from 'lucide-react';
import { Contact } from '../../types/contact';

interface CallRecord {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed' | 'voicemail' | 'busy' | 'no-answer';
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  recording?: {
    url: string;
    duration: number;
    size: number; // in bytes
    transcription?: string;
  };
  notes: string;
  outcome: 'successful' | 'follow_up_needed' | 'not_interested' | 'voicemail' | 'no_answer';
  tags: string[];
  mood: 'positive' | 'neutral' | 'negative';
  followUpDate?: Date;
  createdBy: string;
  isStarred: boolean;
}

interface CallStats {
  totalCalls: number;
  totalDuration: number; // in seconds
  averageDuration: number;
  successRate: number;
  todaysCalls: number;
  weekCalls: number;
  monthCalls: number;
}

const CallLogging: React.FC = () => {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([
    {
      id: '1',
      contactId: '1',
      contactName: 'John Smith',
      contactPhone: '+1 (555) 123-4567',
      type: 'outgoing',
      status: 'completed',
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      endTime: new Date(Date.now() - 1200000), // 20 minutes ago
      duration: 600, // 10 minutes
      recording: {
        url: '/recordings/call-1.mp3',
        duration: 600,
        size: 5242880, // 5MB
        transcription: 'Discussed project requirements and next steps. Client is interested in our proposal.'
      },
      notes: 'Very positive call. Client excited about our proposal. Scheduled follow-up for next week.',
      outcome: 'successful',
      tags: ['hot-lead', 'proposal-discussed'],
      mood: 'positive',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      createdBy: 'John Doe',
      isStarred: true
    },
    {
      id: '2',
      contactId: '2',
      contactName: 'Jane Wilson',
      contactPhone: '+1 (555) 987-6543',
      type: 'incoming',
      status: 'missed',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      duration: 0,
      notes: 'Missed call - need to call back',
      outcome: 'no_answer',
      tags: ['callback-needed'],
      mood: 'neutral',
      createdBy: 'System',
      isStarred: false
    },
    {
      id: '3',
      contactId: '3',
      contactName: 'Mike Johnson',
      contactPhone: '+1 (555) 456-7890',
      type: 'outgoing',
      status: 'voicemail',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 7080000),
      duration: 120, // 2 minutes
      notes: 'Left voicemail about product demo opportunity',
      outcome: 'voicemail',
      tags: ['demo-interest'],
      mood: 'neutral',
      createdBy: 'John Doe',
      isStarred: false
    }
  ]);

  const [isInCall, setIsInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState<Partial<CallRecord> | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [showCallDetails, setShowCallDetails] = useState<CallRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [stats] = useState<CallStats>({
    totalCalls: callRecords.length,
    totalDuration: callRecords.reduce((sum, call) => sum + call.duration, 0),
    averageDuration: callRecords.reduce((sum, call) => sum + call.duration, 0) / callRecords.length,
    successRate: (callRecords.filter(call => call.outcome === 'successful').length / callRecords.length) * 100,
    todaysCalls: callRecords.filter(call => 
      call.startTime.toDateString() === new Date().toDateString()
    ).length,
    weekCalls: callRecords.filter(call => 
      call.startTime >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    monthCalls: callRecords.filter(call => 
      call.startTime >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
  });

  // Placeholder function for starting calls
  // const startCall = (contact: Contact, type: 'incoming' | 'outgoing') => {
  //   const newCall: Partial<CallRecord> = {
  //     contactId: contact.id,
  //     contactName: contact.name,
  //     contactPhone: contact.phone || '',
  //     type,
  //     status: 'completed',
  //     startTime: new Date(),
  //     notes: '',
  //     outcome: 'successful',
  //     tags: [],
  //     mood: 'neutral',
  //     createdBy: 'Current User',
  //     isStarred: false
  //   };

  //   setCurrentCall(newCall);
  //   setIsInCall(true);
  //   setCallTimer(0);
    
  //   // Start timer
  //   timerRef.current = setInterval(() => {
  //     setCallTimer(prev => prev + 1);
  //   }, 1000);
  // };

  const endCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentCall) {
      const completedCall: CallRecord = {
        ...currentCall,
        id: Date.now().toString(),
        endTime: new Date(),
        duration: callTimer,
      } as CallRecord;

      setCallRecords(prev => [completedCall, ...prev]);
    }

    setIsInCall(false);
    setCurrentCall(null);
    setCallTimer(0);
    setIsRecording(false);
    setIsMuted(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallTypeIcon = (type: string, status: string) => {
    if (status === 'missed') {
      return <PhoneCall className="h-4 w-4 text-red-500" />;
    }
    
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="h-4 w-4 text-green-600" />;
      case 'outgoing':
        return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
      default:
        return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'follow_up_needed':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'voicemail':
        return 'bg-blue-100 text-blue-800';
      case 'no_answer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCalls = callRecords.filter(call => {
    const matchesSearch = call.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.contactPhone.includes(searchTerm) ||
                         call.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || call.type === filterType;
    const matchesOutcome = filterOutcome === 'all' || call.outcome === filterOutcome;
    
    return matchesSearch && matchesType && matchesOutcome;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Call Logging</h2>
          <p className="text-gray-600 mt-1">Track and manage all your phone communications</p>
        </div>
        <button
          onClick={() => console.log('Log Call modal would open')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Log Call
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weekCalls}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Call Interface */}
      {isInCall && currentCall && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-full">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{currentCall.contactName}</h3>
                <p className="text-blue-100">{currentCall.contactPhone}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Timer className="h-4 w-4" />
                  <span className="text-lg font-mono">{formatDuration(callTimer)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={toggleRecording}
                className={`p-3 rounded-full transition-colors ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                {isRecording ? <Square className="h-5 w-5" /> : <FileAudio className="h-5 w-5" />}
              </button>

              <button
                onClick={endCall}
                className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              >
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isRecording && (
            <div className="mt-4 flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
              <span>Recording in progress...</span>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>

            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Outcomes</option>
              <option value="successful">Successful</option>
              <option value="follow_up_needed">Follow-up Needed</option>
              <option value="not_interested">Not Interested</option>
              <option value="voicemail">Voicemail</option>
              <option value="no_answer">No Answer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call Records */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Call History</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredCalls.map((call) => (
            <div key={call.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-2">
                    {getCallTypeIcon(call.type, call.status)}
                    {call.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{call.contactName}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                        {call.outcome.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{call.contactPhone}</p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{call.startTime.toLocaleDateString()}</span>
                        <span>{call.startTime.toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>

                      {call.recording && (
                        <div className="flex items-center space-x-1">
                          <FileAudio className="h-4 w-4" />
                          <span>Recorded</span>
                        </div>
                      )}
                    </div>

                    {call.notes && (
                      <p className="text-gray-700 mt-3">{call.notes}</p>
                    )}

                    {call.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {call.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {call.recording && (
                    <button className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                      <Play size={16} />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowCallDetails(call)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50">
                    <Edit size={16} />
                  </button>
                  
                  <button className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCalls.length === 0 && (
          <div className="text-center py-12">
            <Phone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No call records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterOutcome !== 'all'
                ? 'Try adjusting your filters'
                : 'Start making calls to see records here'
              }
            </p>
          </div>
        )}
      </div>

      {/* Call Details Modal */}
      {showCallDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Call Details</h3>
              <button
                onClick={() => setShowCallDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <p className="mt-1 text-sm text-gray-900">{showCallDetails.contactName}</p>
                <p className="text-sm text-gray-600">{showCallDetails.contactPhone}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{showCallDetails.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDuration(showCallDetails.duration)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{showCallDetails.notes || 'No notes'}</p>
              </div>
              
              {showCallDetails.recording && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recording</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">Call Recording</span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Play size={16} />
                        </button>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    {showCallDetails.recording.transcription && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Transcription:</p>
                        <p className="text-sm text-gray-600 mt-1">{showCallDetails.recording.transcription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallLogging;

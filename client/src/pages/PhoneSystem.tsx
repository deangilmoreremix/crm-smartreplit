import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Phone, User, Clock, BarChart2, RefreshCw, Send, MessageSquare, Mic, MicOff, Volume2, VolumeX, PhoneOff, Play, Pause, MousePointer } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { ModernButton } from '../components/ui/ModernButton';

interface CallLog {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  startTime: Date;
  duration: number; // in seconds
  status: 'completed' | 'missed' | 'voicemail';
  notes?: string;
  recordingUrl?: string;
}

const PhoneSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dialer' | 'logs' | 'voicemail' | 'settings'>('dialer');
  const [dialerNumber, setDialerNumber] = useState('');
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callTimer, setCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [recordingPlayback, setRecordingPlayback] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  
  // Call logs data
  const [callLogs] = useState<CallLog[]>([
    {
      id: '1',
      contactName: 'John Doe',
      phoneNumber: '(555) 123-4567',
      direction: 'outbound',
      startTime: new Date(Date.now() - 86400000), // yesterday
      duration: 325, // 5:25
      status: 'completed',
      notes: 'Discussed proposal details. Follow up next week.',
      recordingUrl: 'https://example.com/recording1.mp3'
    },
    {
      id: '2',
      contactName: 'Sarah Williams',
      phoneNumber: '(555) 987-6543',
      direction: 'inbound',
      startTime: new Date(Date.now() - 172800000), // 2 days ago
      duration: 0,
      status: 'missed',
      notes: 'Left a voicemail about scheduling a demo'
    },
    {
      id: '3',
      contactName: 'Robert Johnson',
      phoneNumber: '(555) 456-7890',
      direction: 'outbound',
      startTime: new Date(Date.now() - 259200000), // 3 days ago
      duration: 183, // 3:03
      status: 'completed',
      recordingUrl: 'https://example.com/recording2.mp3'
    },
    {
      id: '4',
      contactName: 'Jane Smith',
      phoneNumber: '(555) 321-7654',
      direction: 'inbound',
      startTime: new Date(Date.now() - 345600000), // 4 days ago
      duration: 0,
      status: 'voicemail',
      notes: 'Asked about pricing options',
      recordingUrl: 'https://example.com/voicemail1.mp3'
    }
  ]);
  
  // Voicemail data
  const voicemails = callLogs.filter(log => log.status === 'voicemail');
  
  // Handle dialer input
  const handleDialerInput = (value: string) => {
    if (dialerNumber.length < 14) { // Limit to standard phone number length
      setDialerNumber(dialerNumber + value);
    }
  };
  
  const handleBackspace = () => {
    if (dialerNumber.length > 0) {
      setDialerNumber(dialerNumber.slice(0, -1));
    }
  };
  
  const formatPhoneNumber = (number: string) => {
    if (number.length <= 3) {
      return number;
    } else if (number.length <= 7) {
      return `(${number.slice(0, 3)}) ${number.slice(3)}`;
    } else {
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
  };
  
  const startCall = () => {
    if (dialerNumber.trim().length === 0) return;
    
    // Use the system dialer to initiate the call
    window.location.href = `tel:${dialerNumber.replace(/\D/g, '')}`;
    
    // In a real implementation, we might also log the call attempt
    // For the demo, we'll also show the in-app calling UI
    setIsCallInProgress(true);
    setCallStatus('Calling...');
    
    // Simulate call connecting
    setTimeout(() => {
      setCallStatus('Connected');
      setCallDuration(0);
      
      // Start timer
      const timerId = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      setCallTimer(timerId);
    }, 2000);
  };
  
  const endCall = () => {
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    setIsCallInProgress(false);
    setCallStatus(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setIsSpeakerOn(false);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleHold = () => {
    setIsOnHold(!isOnHold);
  };
  
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatCallDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const playRecording = (url: string) => {
    if (recordingPlayback === url && isPlayingRecording) {
      setIsPlayingRecording(false);
      setRecordingPlayback(null);
    } else {
      setRecordingPlayback(url);
      setIsPlayingRecording(true);
      
      // Simulate playback (in real app, would use audio player)
      setTimeout(() => {
        setIsPlayingRecording(false);
        setRecordingPlayback(null);
      }, 3000);
    }
  };

  return (
    <PageLayout
      title="Phone System"
      description="Make and receive calls directly from your CRM"
      actions={
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['dialer', 'logs', 'voicemail', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      }
    >

      {/* Tab Content */}
      {activeTab === 'dialer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dialer */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dialer</h2>
            
            <div className="mb-6">
              <input
                type="text"
                value={formatPhoneNumber(dialerNumber)}
                readOnly
                className="w-full text-2xl text-center p-4 border-2 border-gray-300 rounded-lg bg-gray-50"
                placeholder="Enter phone number"
              />
            </div>
            
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDialerInput(digit)}
                  className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-lg text-xl font-semibold transition-colors"
                  disabled={isCallInProgress}
                >
                  {digit}
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mb-4">
              <ModernButton
                onClick={handleBackspace}
                variant="outline"
                disabled={isCallInProgress}
                className="p-3 rounded-full"
              >
                <RefreshCw size={20} />
              </ModernButton>
              
              <ModernButton
                onClick={startCall}
                disabled={dialerNumber.length === 0 || isCallInProgress}
                variant="primary"
                className="p-4 bg-green-500 hover:bg-green-600 rounded-full"
              >
                <Phone size={24} />
              </ModernButton>
            </div>
          </GlassCard>

          {/* Call Controls */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isCallInProgress ? 'Active Call' : 'Call Controls'}
            </h2>
            
            {isCallInProgress ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-lg font-semibold">{callStatus}</div>
                  <div className="text-gray-600">{formatPhoneNumber(dialerNumber)}</div>
                  {callStatus === 'Connected' && (
                    <div className="text-2xl font-bold text-green-600 mt-2">
                      {formatDuration(callDuration)}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center space-x-4 mb-6">
                  <ModernButton
                    onClick={toggleMute}
                    variant={isMuted ? 'primary' : 'outline'}
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </ModernButton>
                  
                  <ModernButton
                    onClick={toggleSpeaker}
                    variant={isSpeakerOn ? 'primary' : 'outline'}
                    className={`p-3 rounded-full ${isSpeakerOn ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  >
                    {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </ModernButton>
                </div>
                
                <ModernButton
                  onClick={endCall}
                  variant="primary"
                  className="p-4 bg-red-500 hover:bg-red-600 rounded-full"
                >
                  <PhoneOff size={24} />
                </ModernButton>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Phone size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No active call</p>
                <p className="text-sm">Use the dialer to start a call</p>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'logs' && (
        <GlassCard>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Call History</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {callLogs.map((log) => (
              <div key={log.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    log.direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Phone size={16} className={
                      log.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                    } />
                  </div>
                  
                  <div>
                    <div className="font-medium">{log.contactName}</div>
                    <div className="text-sm text-gray-600">{log.phoneNumber}</div>
                    <div className="text-xs text-gray-500">
                      {log.startTime.toLocaleDateString()} {log.startTime.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    log.status === 'completed' ? 'bg-green-100 text-green-800' :
                    log.status === 'missed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </div>
                  {log.duration > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {formatCallDuration(log.duration)}
                    </div>
                  )}
                  {log.recordingUrl && (
                    <ModernButton
                      onClick={() => playRecording(log.recordingUrl!)}
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      {recordingPlayback === log.recordingUrl && isPlayingRecording ? (
                        <Pause size={14} className="mr-1" />
                      ) : (
                        <Play size={14} className="mr-1" />
                      )}
                      Recording
                    </ModernButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {activeTab === 'voicemail' && (
        <GlassCard>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Voicemails ({voicemails.length})</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {voicemails.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No voicemails</p>
              </div>
            ) : (
              voicemails.map((voicemail) => (
                <div key={voicemail.id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{voicemail.contactName}</div>
                    <div className="text-sm text-gray-600">
                      {voicemail.startTime.toLocaleDateString()} {voicemail.startTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{voicemail.phoneNumber}</div>
                  {voicemail.notes && (
                    <div className="text-sm text-gray-800 mb-3">{voicemail.notes}</div>
                  )}
                  {voicemail.recordingUrl && (
                    <ModernButton
                      onClick={() => playRecording(voicemail.recordingUrl!)}
                      variant="outline"
                      size="sm"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      {recordingPlayback === voicemail.recordingUrl && isPlayingRecording ? (
                        <Pause size={14} className="mr-1" />
                      ) : (
                        <Play size={14} className="mr-1" />
                      )}
                      Play Voicemail
                    </ModernButton>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}

      {activeTab === 'settings' && (
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-6">Phone Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Country Code
              </label>
              <select className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="+1">+1 (United States)</option>
                <option value="+44">+44 (United Kingdom)</option>
                <option value="+49">+49 (Germany)</option>
                <option value="+33">+33 (France)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Recording
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  <span className="ml-2 text-sm">Enable call recording</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="ml-2 text-sm">Auto-record all calls</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ringtone Volume
              </label>
              <input type="range" min="0" max="100" defaultValue="80" className="w-full max-w-xs" />
            </div>
          </div>
        </GlassCard>
      )}
    </PageLayout>
  );
};

export default PhoneSystem;
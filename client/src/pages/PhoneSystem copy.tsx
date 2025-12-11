import React, { useState } from 'react';
import { Phone, User, Clock, BarChart2, RefreshCw, Send, MessageSquare, Mic, MicOff, Volume2, VolumeX, PhoneOff, Play, Pause, MousePointer } from 'lucide-react';

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
    setIsCallInProgress(false);
    setCallStatus(null);
    
    // Clear timer
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Reset call states
    setCallDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    setIsSpeakerOn(false);
  };
  
  // Add function to handle direct calls from call logs
  const handleCallContact = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber.replace(/\D/g, '')}`;
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const formatDateTimeForCallLog = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  const togglePlayRecording = (recordingUrl: string) => {
    if (recordingPlayback === recordingUrl && isPlayingRecording) {
      setIsPlayingRecording(false);
    } else {
      setRecordingPlayback(recordingUrl);
      setIsPlayingRecording(true);
    }
  };
  
  const renderTab = () => {
    switch (activeTab) {
      case 'dialer':
        return (
          <div className="p-6">
            <div className="mb-6">
              <input
                type="text"
                value={formatPhoneNumber(dialerNumber)}
                readOnly
                className="w-full text-center text-2xl py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            {isCallInProgress ? (
              <div className="mb-6">
                <div className="text-center mb-2">
                  <span className="text-lg font-semibold">{callStatus}</span>
                </div>
                <div className="text-center mb-4">
                  <span className="text-2xl">{formatDuration(callDuration)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                      isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    <span className="text-xs mt-1">Mute</span>
                  </button>
                  <button
                    onClick={() => setIsOnHold(!isOnHold)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                      isOnHold ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isOnHold ? <Play size={24} /> : <Pause size={24} />}
                    <span className="text-xs mt-1">{isOnHold ? 'Resume' : 'Hold'}</span>
                  </button>
                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                      isSpeakerOn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    <span className="text-xs mt-1">Speaker</span>
                  </button>
                </div>
                <button
                  onClick={endCall}
                  className="w-full flex items-center justify-center py-4 rounded-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <PhoneOff size={24} className="mr-2" />
                  End Call
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(digit => (
                  <button
                    key={digit}
                    onClick={() => handleDialerInput(digit.toString())}
                    className="py-4 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-medium text-gray-800"
                  >
                    {digit}
                  </button>
                ))}
              </div>
            )}
            
            {!isCallInProgress && (
              <div className="flex justify-center relative">
                <button
                  onClick={startCall}
                  disabled={dialerNumber.length === 0}
                  className={`flex items-center justify-center w-16 h-16 rounded-full ${
                    dialerNumber.length > 0
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Phone size={24} />
                </button>
                
                {dialerNumber.length > 0 && (
                  <button
                    onClick={handleBackspace}
                    className="absolute right-8 mt-5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* Click-to-call explainer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                <div className="flex justify-center items-center text-blue-600 mb-2">
                  <MousePointer size={16} className="mr-1" />
                  <Phone size={16} className="mr-1" />
                  <span className="text-sm font-medium">Click to Call</span>
                </div>
                <p className="text-sm text-gray-700">
                  When you enter a number and click the call button, your device's default phone app will open, ready to dial.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This works on mobile phones, and computers with calling capabilities.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'logs':
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Calls</h2>
              <button className="text-blue-600 text-sm hover:text-blue-800">
                Export Logs
              </button>
            </div>
            
            <div className="space-y-4">
              {callLogs.map(call => (
                <div key={call.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span className={`mr-2 ${
                          call.direction === 'inbound' ? 'text-green-500 rotate-180' : 'text-blue-500'
                        }`}>
                          <Phone size={16} />
                        </span>
                        <span className="font-medium">{call.contactName}</span>
                      </div>
                      <p className="text-sm text-gray-500">{call.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDateTimeForCallLog(call.startTime)}</p>
                      <div className="flex items-center justify-end">
                        {call.status === 'completed' && (
                          <span className="text-xs text-gray-500">{formatDuration(call.duration)}</span>
                        )}
                        {call.status === 'missed' && (
                          <span className="text-xs text-red-500">Missed</span>
                        )}
                        {call.status === 'voicemail' && (
                          <span className="text-xs text-orange-500">Voicemail</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {call.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {call.notes}
                    </div>
                  )}
                  
                  {call.recordingUrl && (
                    <div className="mt-2">
                      <button
                        onClick={() => togglePlayRecording(call.recordingUrl!)}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        {recordingPlayback === call.recordingUrl && isPlayingRecording ? (
                          <>
                            <Pause size={14} className="mr-1" />
                            Pause Recording
                          </>
                        ) : (
                          <>
                            <Play size={14} className="mr-1" />
                            Play Recording
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-end space-x-2">
                    <button className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md">
                      Add Note
                    </button>
                    <button 
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={() => handleCallContact(call.phoneNumber)}
                    >
                      Call Back
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'voicemail':
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Voicemail</h2>
              <span className="text-sm text-gray-500">{voicemails.length} messages</span>
            </div>
            
            {voicemails.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No voicemail messages</p>
              </div>
            ) : (
              <div className="space-y-4">
                {voicemails.map(voicemail => (
                  <div key={voicemail.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <MessageSquare size={16} className="text-orange-500 mr-2" />
                          <span className="font-medium">{voicemail.contactName}</span>
                        </div>
                        <p className="text-sm text-gray-500">{voicemail.phoneNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDateTimeForCallLog(voicemail.startTime)}</p>
                      </div>
                    </div>
                    
                    {voicemail.notes && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {voicemail.notes}
                      </div>
                    )}
                    
                    {voicemail.recordingUrl && (
                      <div className="mt-3 flex justify-between items-center">
                        <button
                          onClick={() => togglePlayRecording(voicemail.recordingUrl!)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          {recordingPlayback === voicemail.recordingUrl && isPlayingRecording ? (
                            <>
                              <Pause size={16} className="mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play size={16} className="mr-1" />
                              Play
                            </>
                          )}
                        </button>
                        
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md">
                            Mark as Read
                          </button>
                          <button 
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                            onClick={() => handleCallContact(voicemail.phoneNumber)}
                          >
                            Call Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'settings':
        return (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Phone Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-2">Phone Numbers</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">(555) 123-8765</p>
                      <p className="text-sm text-gray-500">Primary Line</p>
                    </div>
                    <button className="text-blue-600 text-sm hover:text-blue-800">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Call Forwarding</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Forward to Mobile</p>
                    <p className="text-sm text-gray-500">(555) 987-1234</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Voicemail Greeting</h3>
                <div className="border rounded-lg p-4">
                  <p className="mb-2">Current greeting: Default</p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
                      <Play size={16} className="mr-1" />
                      Play
                    </button>
                    <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center">
                      <RefreshCw size={16} className="mr-1" />
                      Change
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <p>Missed call notifications</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <p>Voicemail notifications</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <p>Email notifications for missed calls</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Phone System</h1>
        <p className="text-gray-600 mt-1">Make and receive calls directly from your CRM</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('dialer')}
                className={`flex-1 py-3 font-medium text-center ${
                  activeTab === 'dialer' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex justify-center items-center">
                  <Phone size={18} className="mr-1" />
                  Dialer
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`flex-1 py-3 font-medium text-center ${
                  activeTab === 'logs' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex justify-center items-center">
                  <Clock size={18} className="mr-1" />
                  Call Logs
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('voicemail')}
                className={`flex-1 py-3 font-medium text-center ${
                  activeTab === 'voicemail' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex justify-center items-center">
                  <MessageSquare size={18} className="mr-1" />
                  Voicemail
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 font-medium text-center ${
                  activeTab === 'settings' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex justify-center items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Settings
                </div>
              </button>
            </div>
            
            <div className="h-[600px] overflow-y-auto">
              {renderTab()}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Contacts</h2>
            <div className="space-y-4">
              {['John Doe', 'Sarah Williams', 'Robert Johnson'].map((name, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-gray-500">Last called: {index === 0 ? 'Yesterday' : `${index + 1} days ago`}</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 rounded-full hover:bg-gray-100"
                    onClick={() => handleCallContact(`(555) ${index}23-456${index}`)}
                  >
                    <Phone size={18} className="text-green-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Call Summary</h2>
              <span className="text-sm text-gray-500">This Month</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Calls</span>
                <span className="font-semibold">42</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Outbound</span>
                <span className="font-semibold">28</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inbound</span>
                <span className="font-semibold">14</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Duration</span>
                <span className="font-semibold">4:25</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Missed Calls</span>
                <span className="font-semibold text-red-500">7</span>
              </div>
            </div>
            <div className="mt-4">
              <button className="flex items-center text-blue-600 text-sm hover:text-blue-800">
                <BarChart2 size={16} className="mr-1" />
                View Detailed Analytics
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-3">SMS Messages</h2>
            <p className="text-gray-600 text-sm mb-4">
              Quick access to text messaging features to follow up with contacts.
            </p>
            <div className="flex items-center border rounded-md overflow-hidden">
              <input
                type="text"
                placeholder="Enter phone number..."
                className="flex-1 p-2 focus:outline-none"
              />
              <button className="p-2 bg-blue-600 text-white">
                <Send size={18} />
              </button>
            </div>
            <div className="mt-3">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800">
                View Text Message Inbox
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneSystem;
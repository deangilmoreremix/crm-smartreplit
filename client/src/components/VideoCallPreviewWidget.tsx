import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Minimize2, 
  Maximize2, 
  MessageSquare, 
  Users,
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX,
  Settings,
  MoreVertical,
  X,
  Plus,
  UserPlus,
  Zap,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useContactStore } from '../store/contactStore';
import Avatar from './ui/Avatar';
import { getInitials } from '../utils/avatars';

// Convert to React.memo to prevent unnecessary re-renders of the entire component
const VideoCallPreviewWidget = React.memo(() => {
  const { isDark } = useTheme();
  const { 
    currentCall, 
    callStatus, 
    initiateCall, 
    initiateGroupCall, 
    isGroupCall, 
    participants 
  } = useVideoCall();
  const { contacts } = useContactStore();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration] = useState(127); // Sample duration
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGroupCallSetup, setIsGroupCallSetup] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDropdownMenu, setShowDropdownMenu] = useState(false);
  
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Show preview widget only when not in an actual call
  if (currentCall || callStatus !== 'idle') return null;

  // Sample participant data
  const sampleParticipant = {
    id: '1',
    name: 'Jane Doe',
    email: 'jane.doe@microsoft.com',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get contacts for contact list
  const contactList = Object.values(contacts).slice(0, 6);

  // Handle starting a call with a selected contact
  const handleStartCall = async (contactId: string, type: 'video' | 'audio') => {
    const contact = contacts[contactId];
    if (!contact) return;

    try {
      await initiateCall({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatarSrc || contact.avatar
      }, type);
      setIsExpanded(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };
  
  // Handle starting a group call
  const handleStartGroupCall = async (type: 'video' | 'audio') => {
    if (selectedContacts.length === 0) return;
    
    // Get participant objects from selected contacts
    const participantList = selectedContacts.map(id => {
      const contact = contacts[id];
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatarSrc || contact.avatar
      };
    });
    
    try {
      await initiateGroupCall(participantList, type);
      setIsExpanded(false);
      setIsGroupCallSetup(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error('Failed to start group call:', error);
    }
  };
  
  // Toggle contact selection for group calls
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  // Group call setup view
  if (isGroupCallSetup) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className={`${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-2xl border ${isDark ? 'border-white/20' : 'border-gray-200'} rounded-2xl overflow-hidden shadow-2xl w-96 max-h-[80vh] flex flex-col`}>
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center space-x-2">
              <Users className={isDark ? 'text-blue-400' : 'text-blue-600'} size={18} />
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                New Group Call
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedContacts.length} selected
              </span>
              <button
                onClick={() => setIsGroupCallSetup(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
          </div>

          {/* Contact Selection */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search contacts..."
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'bg-gray-800 border-white/10 text-white placeholder:text-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
            
            {contactList.length > 0 ? (
              <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-200'}`}>
                {contactList.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                    onClick={() => toggleContactSelection(contact.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        selectedContacts.includes(contact.id)
                          ? 'bg-blue-500 border-blue-500'
                          : isDark 
                            ? 'border-gray-600' 
                            : 'border-gray-300'
                      }`}>
                        {selectedContacts.includes(contact.id) && (
                          <CheckCircle size={12} className="text-white" />
                        )}
                      </div>
                      
                      <Avatar
                        src={contact.avatarSrc || contact.avatar}
                        alt={contact.name}
                        size="md"
                        fallback={getInitials(contact.name)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {contact.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {contact.title || contact.position} {contact.company ? `at ${contact.company}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users size={32} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No contacts found</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsGroupCallSetup(false)}
                className={`px-4 py-2 ${
                  isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } rounded-lg transition-colors`}
              >
                Cancel
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStartGroupCall('audio')}
                  disabled={selectedContacts.length === 0}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Phone size={16} />
                  <span>Audio Call</span>
                </button>
                
                <button
                  onClick={() => handleStartGroupCall('video')}
                  disabled={selectedContacts.length === 0}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Video size={16} />
                  <span>Video Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Contact selection view
  if (isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className={`${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-2xl border ${isDark ? 'border-white/20' : 'border-gray-200'} rounded-2xl overflow-hidden shadow-2xl w-80 max-h-96`}>
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Start a Call
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
            >
              <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>

          {/* Contact List */}
          <div className="max-h-80 overflow-y-auto">
            {contactList.length > 0 ? (
              contactList.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'} transition-colors last:border-b-0`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={contact.avatarSrc || contact.avatar}
                        alt={contact.name}
                        size="md"
                        fallback={getInitials(contact.name)}
                      />
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {contact.name}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {contact.title || contact.position} {contact.company ? `at ${contact.company}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartCall(contact.id, 'video')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isDark 
                            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                            : 'bg-green-100 hover:bg-green-200 text-green-600'
                        }`}
                        title="Start video call"
                      >
                        <Video size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleStartCall(contact.id, 'audio')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isDark 
                            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                        }`}
                        title="Start audio call"
                      >
                        <Phone size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Users size={32} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No contacts found</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} bg-gradient-to-r ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'}`}>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setIsGroupCallSetup(true);
                  setIsExpanded(false);
                }}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${isDark ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} transition-colors`}
              >
                <Users size={16} />
                <span className="text-sm font-medium">Group Call</span>
              </button>
              <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'} transition-colors`}>
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 hardware-accelerated contain-layout">
      <div 
        className={`backdrop-blur-2xl border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-gray-900/95 border-white/20' : 'bg-white/95 border-gray-200'
        } ${
          isMinimized ? 'w-20 h-20' : 'w-96 h-72'
        }`}
      >
        {isMinimized ? (
          // Minimized view
          <div 
            className="w-full h-full relative group cursor-pointer" 
            onClick={() => setIsMinimized(false)}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Avatar
                src={sampleParticipant.avatar}
                alt={sampleParticipant.name}
                size="md"
                fallback={getInitials(sampleParticipant.name)}
              />
            </div>
            
            <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={16} className="text-white" />
            </div>
            
            {/* Call status indicator */}
            <div className="absolute top-2 right-2 flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs text-white bg-black/50 px-1 rounded">
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>
        ) : (
          // Expanded view
          <>
            {/* Video Container */}
            <div 
              className="relative w-full h-48 bg-gray-900"
              onMouseEnter={() => setShowControls(true)}
            >
              {/* Remote Video Background */}
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                {/* Background avatar */}
                <div className="text-center">
                  <Avatar
                    src={sampleParticipant.avatar}
                    alt={sampleParticipant.name}
                    size="xl"
                    fallback={getInitials(sampleParticipant.name)}
                    className="mx-auto mb-3"
                  />
                  <p className="text-white font-medium">{sampleParticipant.name}</p>
                  <p className="text-white/70 text-sm">Connected</p>
                </div>

                {/* Video overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-center transform transition-none">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80 text-sm">Video Call Preview</p>
                  </div>
                </div>
              </div>

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                {isVideoEnabled ? (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">JD</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <VideoOff size={16} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Header Controls */}
              <div className={`absolute top-3 left-3 right-3 flex justify-between items-center transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="flex items-center space-x-2">
                  {/* Connection Quality */}
                  <div className="flex items-center space-x-1 bg-black/50 rounded-full px-3 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-white text-xs">Excellent</span>
                  </div>
                  
                  {/* Call Duration */}
                  <div className="bg-black/50 rounded-full px-3 py-1">
                    <span className="text-white text-xs">{formatDuration(callDuration)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Minimize2 size={14} className="text-white" />
                  </button>
                  
                  {/* More options dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdownMenu(!showDropdownMenu);
                      }}
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <MoreVertical size={14} className="text-white" />
                    </button>
                    
                    {showDropdownMenu && (
                      <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-10 ${
                        isDark ? 'bg-gray-800 border border-white/10' : 'bg-white border border-gray-200'
                      }`}>
                        <div className="py-1">
                          <button className={`w-full text-left px-4 py-2 text-sm ${
                            isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-gray-700'
                          } flex items-center space-x-2`}>
                            <Settings size={14} className="text-gray-400" />
                            <span>Call Settings</span>
                          </button>
                          <button className={`w-full text-left px-4 py-2 text-sm ${
                            isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-gray-700'
                          } flex items-center space-x-2`}>
                            <Volume2 size={14} className="text-gray-400" />
                            <span>Audio Settings</span>
                          </button>
                          <button className={`w-full text-left px-4 py-2 text-sm ${
                            isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-gray-700'
                          } flex items-center space-x-2`}>
                            <Zap size={14} className="text-gray-400" />
                            <span>Test Connection</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Screen Share Indicator */}
              {isScreenSharing && (
                <div className="absolute bottom-4 left-4">
                  <div className="bg-blue-500 rounded-lg px-3 py-1 flex items-center space-x-2">
                    <Monitor size={14} className="text-white" />
                    <span className="text-white text-xs">Sharing Screen</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controls Panel */}
            <div className={`p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'} transition-opacity duration-300`}>
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isAudioEnabled 
                        ? `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-gray-300' : 'text-gray-600'}` 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                  >
                    {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isVideoEnabled 
                        ? `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-gray-300' : 'text-gray-600'}` 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>

                  <button
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isScreenSharing 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : `${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-gray-300' : 'text-gray-600'}`
                    }`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
                  </button>
                </div>

                {/* Center - Participant Info */}
                <div className="flex-1 text-center">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Call Preview
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ready to connect
                  </p>
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-3">
                  <button 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                    title="Chat"
                  >
                    <MessageSquare size={16} />
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsGroupCallSetup(true);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isDark 
                        ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' 
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                    }`}
                    title="Group call"
                  >
                    <Users size={16} />
                  </button>
                  
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isDark 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    title="Select contact"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default VideoCallPreviewWidget;
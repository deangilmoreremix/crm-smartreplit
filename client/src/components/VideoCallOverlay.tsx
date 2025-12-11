import React, { useRef, useEffect, useState } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useVideoCall } from '../contexts/VideoCallContext';
import Avatar from './ui/Avatar';
import { getInitials } from '../utils/avatars';
import ConnectionQuality from './ConnectionQuality';
import InCallMessaging from './InCallMessaging';
import CallRecording from './CallRecording';

// Extract call duration into a separate component to prevent full component re-renders
const CallDurationDisplay: React.FC<{ duration: number }> = React.memo(({ duration }) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span className="text-white text-xs">{formatDuration(duration)}</span>
  );
});

const VideoCallOverlay = () => {
  const {
    currentCall,
    isInCall,
    callStatus,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    endCall,
    acceptCall,
    rejectCall,
    connectionQuality
  } = useVideoCall();
  
  const { isDark } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Use refs with useRef to avoid re-renders when updating refs
  const localVideoRef = useRef<HTMLVideoElement>(null); 
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null); 
  const remoteVideoRef = useRef<HTMLVideoElement>(null); 
  const lastRenderTimeRef = useRef<number>(Date.now());

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      // Only update if the stream has actually changed to prevent unnecessary layout shifts
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream]); // Keep the dependency array slim

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      // Only update if the stream has actually changed
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

  // Throttled call duration timer to prevent excessive renders
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isInCall) {
      interval = setInterval(() => {
        // Throttle updates to once per second maximum
        const now = Date.now();
        if (now - lastRenderTimeRef.current >= 1000) {
          lastRenderTimeRef.current = now;
          setCallDuration(prevDuration => prevDuration + 1);
        }
      }, 500); // Check twice per second but only update when needed
    } else {
      setCallDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  // Optimized auto-hide controls with cleanup
  useEffect(() => {
    if (!isInCall) return;
    
    // Clear any existing timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    // Set new timer
    controlsTimerRef.current = setTimeout(() => {
      if (isInCall) {
        setShowControls(false);
      }
    }, 5000);
    
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
    };
  }, [isInCall, showControls]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentCall) return null;

  // Incoming call notification
  if (callStatus === 'ringing') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center hardware-accelerated">
        <div className={`${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-2xl border ${isDark ? 'border-white/20' : 'border-gray-200'} rounded-3xl overflow-hidden shadow-2xl max-w-md w-full mx-4`}>
          {/* Caller Info */}
          <div className="p-8 text-center">
            <div className="mb-6">
              <Avatar
                src={currentCall.recipient.avatar}
                alt={currentCall.recipient.name}
                size="2xl"
                fallback={getInitials(currentCall.recipient.name)}
                className="mx-auto"
              />
            </div>
            
            <h2 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentCall.recipient.name}
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              {currentCall.recipient.email}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Incoming {currentCall.type} call...
            </p>
            
            {/* Animated rings */}
            <div className="relative mt-6">
              <div className="absolute inset-0 animate-ping">
                <div className="h-20 w-20 mx-auto rounded-full bg-green-400/20"></div>
              </div>
              <div className="relative">
                <div className="h-20 w-20 mx-auto rounded-full bg-green-400/10 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Call Actions */}
          <div className="flex justify-center space-x-8 p-6 bg-black/10">
            <button
              onClick={rejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
            
            <button
              onClick={acceptCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <Phone size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contain-layout">
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-2xl border ${isDark ? 'border-white/20' : 'border-gray-200'} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isMinimized ? 'w-20 h-20' : 'w-96 h-72'
        }`}>
          {isMinimized ? (
            // Minimized view
            <div 
              className="w-full h-full relative group cursor-pointer" 
              onClick={() => setIsMinimized(false)}
            >
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Avatar
                    src={currentCall.recipient.avatar}
                    alt={currentCall.recipient.name}
                    size="md"
                    fallback={getInitials(currentCall.recipient.name)}
                  />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={16} className="text-white" />
              </div>
              
              {/* Call status indicator */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  connectionQuality === 'excellent' ? 'bg-green-400' :
                  connectionQuality === 'good' ? 'bg-yellow-400' :
                  connectionQuality === 'poor' ? 'bg-orange-400' :
                  'bg-red-400'
                }`}></div>
                {isInCall && (
                  <span className="text-xs text-white bg-black/50 px-1 rounded">
                    {formatDuration(callDuration)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Expanded view
            <>
              {/* Video Container */}
              <div 
                className="relative w-full h-48 bg-gray-900"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => isInCall && setShowControls(false)}
              >
                {/* Remote Video */}
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center">
                      <Avatar
                        src={currentCall.recipient.avatar}
                        alt={currentCall.recipient.name}
                        size="xl"
                        fallback={getInitials(currentCall.recipient.name)}
                        className="mx-auto mb-3"
                      />
                      <p className="text-white font-medium">{currentCall.recipient.name}</p>
                      <p className="text-white/70 text-sm">
                        {callStatus === 'calling' ? 'Calling...' : 
                         callStatus === 'ringing' ? 'Ringing...' : 
                         callStatus === 'connected' ? 'Connected' : 'Connecting...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                {localStream && (
                  <div className="absolute top-4 right-4 w-24 h-18 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
                    {isVideoEnabled ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <VideoOff size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* Header Controls */}
                <div className={`absolute top-3 left-3 right-3 flex justify-between items-center transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="flex items-center space-x-2">
                    {/* Connection Quality */}
                    <ConnectionQuality />
                    {isInCall && (
                      <div className="bg-black/50 rounded-full px-3 py-1">
                        <CallDurationDisplay duration={callDuration} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Minimize2 size={14} className="text-white" />
                    </button>
                    <button
                      onClick={endCall}
                      className="w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <span className="text-white text-sm">×</span>
                    </button>
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
              <div className={`p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'} transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={toggleAudio}
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
                      onClick={toggleVideo}
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
                      onClick={toggleScreenShare}
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
                      {currentCall.recipient.name}
                    </p>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowMessaging(!showMessaging)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        showMessaging
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : `${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`
                      }`}
                      title="Chat"
                    >
                      <MessageSquare size={16} />
                    </button>
                    
                    <button 
                      onClick={() => setShowRecording(!showRecording)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                      title="Recording"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    <button 
                      onClick={endCall}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                      title="End call"
                    >
                      <PhoneOff size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* In-Call Messaging */}
      <InCallMessaging
        isVisible={showMessaging}
        onClose={() => setShowMessaging(false)}
        remoteParticipantName={currentCall.recipient.name}
      />

      {/* Call Recording Panel */}
      {showRecording && (
        <div className="fixed right-4 bottom-80 w-96 max-h-96 overflow-y-auto">
          <div className={`${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl border ${isDark ? 'border-white/20' : 'border-gray-200'} rounded-2xl shadow-2xl`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Call Recording
              </h3>
              <button
                onClick={() => setShowRecording(false)}
                className={`text-gray-400 hover:${isDark ? 'text-white' : 'text-gray-600'} transition-colors`}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <CallRecording
                isInCall={isInCall}
                localStream={localStream}
                remoteStream={remoteStream}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(VideoCallOverlay);
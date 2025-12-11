import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  PhoneOff,
  Play,
  Users,
  CheckCircle
} from 'lucide-react';

const VideoCallDemo: React.FC = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [showPermissionError, setShowPermissionError] = useState(false);

  // Sample participant for demo
  const demoParticipant = {
    name: 'Sarah Johnson',
    role: 'Sales Manager',
    avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
  };

  const startDemoCall = async () => {
    try {
      setShowPermissionError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoEnabled, 
        audio: isAudioEnabled 
      });
      
      setLocalStream(stream);
      setIsCallActive(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access media devices:', error);
      setShowPermissionError(true);
      // Still show demo mode even if camera access fails
      setIsCallActive(true);
    }
  };

  const endDemoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsCallActive(false);
    setShowPermissionError(false);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
      {!isCallActive ? (
        // Pre-call interface
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Try Our Video Calling
            </h3>
            <p className="text-gray-300">
              Experience crystal-clear video calls with screen sharing, recording, and AI-powered meeting notes
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>HD Video & Audio</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Screen Sharing</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Recording</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>AI Transcription</span>
            </div>
          </div>

          <button
            onClick={startDemoCall}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Demo Call
          </button>
        </div>
      ) : (
        // In-call interface
        <div className="relative h-[500px]">
          {/* Remote participant (demo image) */}
          <div className="absolute inset-0 bg-gray-900">
            <img 
              src={demoParticipant.avatar} 
              alt={demoParticipant.name}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded-lg">
              <p className="text-white font-medium">{demoParticipant.name}</p>
              <p className="text-gray-300 text-sm">{demoParticipant.role}</p>
            </div>
          </div>

          {/* Local participant video */}
          <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {localStream && isVideoEnabled ? (
              <video 
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <VideoOff className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Camera Off</p>
                </div>
              </div>
            )}
          </div>

          {/* Permission error message */}
          {showPermissionError && (
            <div className="absolute top-4 right-4 bg-yellow-500/90 text-white px-4 py-2 rounded-lg max-w-xs">
              <p className="text-sm">Camera access not available. Demo mode active.</p>
            </div>
          )}

          {/* Call controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={endDemoCall}
                className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mt-3">
              <p className="text-white text-sm">Demo Call Active</p>
              <p className="text-gray-300 text-xs">Click end call to exit demo</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallDemo;
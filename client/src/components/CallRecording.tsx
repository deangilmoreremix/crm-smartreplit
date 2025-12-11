import React, { useState, useRef, useEffect } from 'react';
import { 
  Circle, 
  Square, 
  Download, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  FileText,
  Video,
  Mic,
  Monitor
} from 'lucide-react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useTheme } from '../contexts/ThemeContext';

interface CallRecordingProps {
  isInCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const CallRecording: React.FC<CallRecordingProps> = ({ 
  isInCall, 
  localStream, 
  remoteStream 
}) => {
  const { isDark } = useTheme();
  const { startRecording, stopRecording, isRecording } = useVideoCall();
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Failed to start recording: ${error.message}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      {isInCall && (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Call Recording
            </h3>
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-400">
                <Circle size={8} className="fill-current animate-pulse" />
                <span className="text-sm font-mono">{formatDuration(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Recording Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={!localStream}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50'
                  }`}
                >
                  <Circle size={16} />
                  <span className="text-sm font-medium">Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <Square size={16} />
                  <span className="text-sm font-medium">Stop Recording</span>
                </button>
              )}
            </div>

            {/* Recording Info */}
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                What's being recorded:
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <Video size={12} className={localStream?.getVideoTracks().length ? 'text-green-400' : 'text-gray-400'} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Your Video
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Mic size={12} className={localStream?.getAudioTracks().length ? 'text-green-400' : 'text-gray-400'} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Your Audio
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Monitor size={12} className={remoteStream ? 'text-green-400' : 'text-gray-400'} />
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    Remote Stream
                  </span>
                </div>
              </div>
            </div>

            {/* Recording Notes */}
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                📹 <strong>High Quality Recording:</strong> Recording includes both video and audio from all participants. 
                Files are automatically downloaded when recording stops.
              </p>
            </div>

            {isRecording && (
              <div className={`p-3 rounded-lg border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  🔴 <strong>Recording in progress:</strong> All participants have been notified. 
                  Recording will automatically save when stopped.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recording Tips */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'}`}>
        <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recording Tips
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Recordings capture both your video/audio and the remote participant's stream
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Files are automatically downloaded as WebM format when recording stops
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Screen sharing content is also included if active during recording
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Ensure stable internet connection for best recording quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallRecording;
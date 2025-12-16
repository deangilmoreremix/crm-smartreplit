import React, { useState, useRef, useCallback, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
// import { useOpenAI } from '../services/openaiService';
import {
  Video,
  Download,
  Trash,
  Play,
  Pause,
  RefreshCw,
  Camera,
  X,
  Check,
  Clock,
  Scissors,
  FileVideo,
  Copy,
  Mail,
  Sliders,
  PenTool,
  List,
  Brain,
  Settings,
  ChevronRight,
  ChevronLeft,
  Upload as UploadIcon,
  Edit,
  Link,
  AlertCircle,
  MessageSquare,
  Share2,
  Send,
  UserCircle,
  BarChart3,
  Lightbulb,
  Eye,
  Mic
} from 'lucide-react';

interface VideoRecordingData {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  title: string;
  recipients?: string[];
  status?: 'draft' | 'sent';
  thumbnailUrl?: string;
  size: number;
  viewCount?: number;
  watchTimePercentage?: number;
}

interface TalkingPoint {
  id: string;
  text: string;
  completed: boolean;
}

const VideoEmail: React.FC = () => {
  // Video Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<VideoRecordingData[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<VideoRecordingData | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Video Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Email Composition States
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  
  // Talking Points States
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [showTalkingPoints, setShowTalkingPoints] = useState(false);
  const [isGeneratingTalkingPoints, setIsGeneratingTalkingPoints] = useState(false);
  
  // Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // AI Enhancement States
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Errors and UI states
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'record' | 'library'>('record');
  
  // AI Services - Commented out for now to avoid dependency issues
  // const openai = useOpenAI();
  
  // Mock recipients for demo
  const availableRecipients = [
    { email: "john.doe@acme.com", name: "John Doe", company: "Acme Inc", position: "CTO" },
    { email: "sarah.smith@globex.com", name: "Sarah Smith", company: "Globex Corp", position: "Marketing Director" },
    { email: "mike.johnson@initech.com", name: "Mike Johnson", company: "Initech", position: "CEO" }
  ];
  
  // Initialize video recorder
  const initializeRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: !isMuted
      });
      
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const newRecording: VideoRecordingData = {
          id: Date.now().toString(),
          blob,
          url,
          duration: recordingTime,
          timestamp: new Date(),
          title: `Video Recording - ${new Date().toLocaleDateString()}`,
          size: blob.size
        };
        
        setRecordings(prev => [newRecording, ...prev]);
        setSelectedRecording(newRecording);
        chunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
    } catch (err) {
      setError('Error accessing camera: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error accessing media devices:', err);
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (mediaRecorderRef.current && videoStream) {
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start the timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      chunksRef.current = [];
      mediaRecorderRef.current.start(1000);
    } else {
      initializeRecorder().then(() => {
        // Start recording after initialization
        if (mediaRecorderRef.current) {
          setIsRecording(true);
          setRecordingTime(0);
          
          // Start the timer
          timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
          
          chunksRef.current = [];
          mediaRecorderRef.current.start(1000);
        }
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Generate talking points using AI (currently using mock data)
  const generateTalkingPoints = async () => {
    setIsGeneratingTalkingPoints(true);
    
    try {
      // Mock talking points for now since OpenAI service is disabled
      const mockTalkingPoints = [
        "Introduce yourself and company background",
        "Highlight key product benefits and value proposition",
        "Address potential customer pain points",
        "Present competitive advantages and differentiators",
        "Conclude with clear call-to-action and next steps"
      ];
      
      const newTalkingPoints: TalkingPoint[] = mockTalkingPoints.map((point: string, index: number) => ({
        id: `point-${index}`,
        text: point,
        completed: false
      }));
      
      setTalkingPoints(newTalkingPoints);
    } catch (error) {
      console.error("Failed to generate talking points:", error);
    } finally {
      setIsGeneratingTalkingPoints(false);
    }
  };
  
  // Delete recording
  const deleteRecording = (id: string) => {
    const recordingToDelete = recordings.find(rec => rec.id === id);
    
    if (recordingToDelete) {
      URL.revokeObjectURL(recordingToDelete.url);
      setRecordings(recordings.filter(rec => rec.id !== id));
      
      if (selectedRecording?.id === id) {
        setSelectedRecording(null);
      }
    }
  };

  return (
    <PageLayout
      title="Video Email"
      description="Create personalized video messages for your prospects"
      actions={
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'record'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera size={16} className="inline mr-1" />
            Record
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileVideo size={16} className="inline mr-1" />
            Library
          </button>
        </div>
      }
    >

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle size={20} className="text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {activeTab === 'record' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Record Video</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-md ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                    className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              
              {/* Video Preview */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted={isMuted}
                  className="w-full h-64 object-cover"
                />
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm font-medium">
                      REC {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
                
                {/* Recording Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <Camera size={24} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className="w-12 h-12 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center text-white"
                        >
                          {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="w-16 h-16 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center text-white"
                        >
                          <div className="w-6 h-6 bg-white rounded-sm"></div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Video Library</h2>
                <span className="text-sm text-gray-500">{recordings.length} recordings</span>
              </div>
              
              {recordings.length === 0 ? (
                <div className="text-center py-12">
                  <FileVideo size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
                  <p className="text-gray-500 mb-4">Start recording to create your first video email</p>
                  <button
                    onClick={() => setActiveTab('record')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Camera size={16} className="inline mr-1" />
                    Start Recording
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recordings.map((recording) => (
                    <div key={recording.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-video bg-gray-900 rounded-lg mb-3 overflow-hidden">
                        <video
                          src={recording.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 truncate">{recording.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{formatTime(recording.duration)}</span>
                          <span>{recording.timestamp.toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRecording(recording)}
                            className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <Mail size={14} className="inline mr-1" />
                            Send
                          </button>
                          <button
                            onClick={() => deleteRecording(recording.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Talking Points */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Talking Points</h3>
              <button
                onClick={generateTalkingPoints}
                disabled={isGeneratingTalkingPoints}
                className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50"
              >
                {isGeneratingTalkingPoints ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Brain size={16} />
                )}
              </button>
            </div>
            
            {talkingPoints.length === 0 ? (
              <div className="text-center py-6">
                <Lightbulb size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generate AI-powered talking points for your video</p>
              </div>
            ) : (
              <div className="space-y-2">
                {talkingPoints.map((point) => (
                  <div key={point.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={point.completed}
                      onChange={(e) => {
                        setTalkingPoints(talkingPoints.map(p => 
                          p.id === point.id ? { ...p, completed: e.target.checked } : p
                        ));
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className={`text-sm ${point.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {point.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Composer */}
          {selectedRecording && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Send Video Email</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email addresses..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Video message for you"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Add a personal message..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
                  <Send size={16} className="mr-1" />
                  Send Video Email
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Videos</span>
                <span className="text-sm font-medium">{recordings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Videos Sent</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg View Rate</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VideoEmail;
import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Pause, 
  Square, 
  Send, 
  Download, 
  Trash2, 
  Settings, 
  Sliders, 
  Mail, 
  Users, 
  List, 
  Clock, 
  CheckCircle, 
  X, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  RefreshCw
} from 'lucide-react';
import './VideoEmail.css';

const VideoEmail: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [showSettings, setShowSettings] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showTalkingPoints, setShowTalkingPoints] = useState(false);
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [newTalkingPoint, setNewTalkingPoint] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentVideos, setSentVideos] = useState<{
    id: string;
    recipient: string;
    subject: string;
    date: Date;
    duration: number;
    viewed: boolean;
    viewCount: number;
  }[]>([
    {
      id: '1',
      recipient: 'john.doe@example.com',
      subject: 'Product Demo Follow-up',
      date: new Date(Date.now() - 86400000 * 2), // 2 days ago
      duration: 65, // seconds
      viewed: true,
      viewCount: 3
    },
    {
      id: '2',
      recipient: 'sarah.smith@example.com',
      subject: 'Introduction to Our Services',
      date: new Date(Date.now() - 86400000 * 5), // 5 days ago
      duration: 42, // seconds
      viewed: true,
      viewCount: 1
    },
    {
      id: '3',
      recipient: 'mike.johnson@example.com',
      subject: 'Proposal Walkthrough',
      date: new Date(Date.now() - 86400000), // 1 day ago
      duration: 78, // seconds
      viewed: false,
      viewCount: 0
    }
  ]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter options
  const filters = [
    { id: 'none', name: 'Normal', value: 'none' },
    { id: 'grayscale', name: 'Grayscale', value: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', value: 'sepia(70%)' },
    { id: 'contrast', name: 'High Contrast', value: 'contrast(150%)' },
    { id: 'brightness', name: 'Bright', value: 'brightness(130%)' },
    { id: 'blur', name: 'Soft Focus', value: 'blur(1px)' },
    { id: 'professional', name: 'Professional', value: 'saturate(110%) brightness(105%) contrast(105%)' }
  ];
  
  // Initialize camera when component mounts
  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);
  
  // Update timer during recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);
  
  // Initialize camera
  const initializeCamera = async () => {
    try {
      const constraints = {
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  // Toggle microphone
  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };
  
  // Toggle camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraEnabled(!isCameraEnabled);
    }
  };
  
  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;
    
    setRecordedChunks([]);
    setRecordingTime(0);
    
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    const mediaRecorder = new MediaRecorder(streamRef.current, options);
    
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
    };
    
    mediaRecorder.start(1000); // Collect data every second
    setIsRecording(true);
    setIsPaused(false);
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };
  
  // Pause/resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
      mediaRecorderRef.current.pause();
    }
    
    setIsPaused(!isPaused);
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Add recipient
  const addRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };
  
  // Remove recipient
  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };
  
  // Add talking point
  const addTalkingPoint = () => {
    if (newTalkingPoint.trim()) {
      setTalkingPoints([...talkingPoints, newTalkingPoint]);
      setNewTalkingPoint('');
    }
  };
  
  // Remove talking point
  const removeTalkingPoint = (index: number) => {
    setTalkingPoints(talkingPoints.filter((_, i) => i !== index));
  };
  
  // Send video email
  const sendVideoEmail = () => {
    if (!videoURL || recipients.length === 0 || !subject) {
      alert('Please record a video, add recipients, and provide a subject');
      return;
    }
    
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      // Add to sent videos
      const newSentVideo = {
        id: Date.now().toString(),
        recipient: recipients.join(', '),
        subject,
        date: new Date(),
        duration: recordingTime,
        viewed: false,
        viewCount: 0
      };
      
      setSentVideos([newSentVideo, ...sentVideos]);
      
      // Reset form
      setVideoURL(null);
      setRecordedChunks([]);
      setRecipients([]);
      setSubject('');
      setMessage('');
      setRecordingTime(0);
      setIsSending(false);
      
      // Show success message
      alert('Video email sent successfully!');
    }, 2000);
  };
  
  // Download recorded video
  const downloadVideo = () => {
    if (!videoURL) return;
    
    const a = document.createElement('a');
    a.href = videoURL;
    a.download = `video-email-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Discard recorded video
  const discardVideo = () => {
    setVideoURL(null);
    setRecordedChunks([]);
    setRecordingTime(0);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Video Email</h1>
        <p className="text-gray-600 mt-1">Create and send personalized video messages to your contacts</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Video Preview/Recording Area */}
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900">
                <video 
                  ref={videoRef} 
                  className={`w-full h-full object-cover ${videoURL ? '' : 'filter'}`}
                  style={{ '--filter-value': selectedFilter !== 'none' ? filters.find(f => f.id === selectedFilter)?.value : 'none' } as React.CSSProperties}
                  autoPlay={!videoURL} 
                  muted={!videoURL}
                  playsInline
                  controls={!!videoURL}
                  src={videoURL || undefined}
                />
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2 record-pulse"></div>
                    <span className="text-sm font-medium">
                      {isPaused ? 'Paused' : 'Recording'}: {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
                
                {/* Talking points overlay */}
                {showTalkingPoints && talkingPoints.length > 0 && isRecording && !isPaused && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded-lg max-h-32 overflow-y-auto">
                    <h4 className="text-sm font-bold mb-2">Talking Points:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {talkingPoints.map((point, index) => (
                        <li key={index} className="text-sm talking-point">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Video controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 px-4 py-2 rounded-full video-controls">
                  {!isRecording && !videoURL && (
                    <button 
                      onClick={startRecording}
                      className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full"
                    >
                      <Play size={24} fill="white" />
                    </button>
                  )}
                  
                  {isRecording && (
                    <>
                      <button 
                        onClick={togglePause}
                        className="w-10 h-10 flex items-center justify-center bg-white text-gray-800 rounded-full"
                      >
                        {isPaused ? <Play size={20} /> : <Pause size={20} />}
                      </button>
                      
                      <button 
                        onClick={stopRecording}
                        className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full"
                      >
                        <Square size={20} />
                      </button>
                    </>
                  )}
                  
                  {videoURL && (
                    <>
                      <button 
                        onClick={downloadVideo}
                        className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full"
                      >
                        <Download size={20} />
                      </button>
                      
                      <button 
                        onClick={discardVideo}
                        className="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded-full"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Video settings bar */}
              <div className="bg-gray-100 p-3 border-t border-gray-200 flex justify-between items-center">
                <div className="flex space-x-3">
                  <button 
                    onClick={toggleMicrophone}
                    className={`p-2 rounded-md ${isMicEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}
                    title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  
                  <button 
                    onClick={toggleCamera}
                    className={`p-2 rounded-md ${isCameraEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}
                    title={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isCameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
                  </button>
                  
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-md ${showSettings ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}
                    title="Video settings"
                  >
                    <Settings size={18} />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowTalkingPoints(!showTalkingPoints)}
                    className={`text-sm flex items-center ${showTalkingPoints ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    <List size={16} className="mr-1" />
                    {showTalkingPoints ? 'Hide' : 'Show'} Talking Points
                  </button>
                </div>
              </div>
              
              {/* Settings panel */}
              {showSettings && (
                <div className="bg-white border-t border-b border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Video Settings</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Video Filter</label>
                    <div className="grid grid-cols-4 gap-2">
                      {filters.map(filter => (
                        <div 
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`cursor-pointer filter-option p-2 rounded border ${selectedFilter === filter.id ? 'selected' : ''}`}
                        >
                          <div 
                            className="h-12 bg-gray-200 rounded mb-1 overflow-hidden"
                            style={{ filter: filter.value }}
                          >
                            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                          </div>
                          <p className="text-xs text-center">{filter.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Maximum Recording Time</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="60">1 minute</option>
                      <option value="120">2 minutes</option>
                      <option value="300" selected>5 minutes</option>
                      <option value="600">10 minutes</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Email composition area */}
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients
                </label>
                <div className="flex items-center">
                  <input
                    type="email"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 p-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={addRecipient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {recipients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipients.map(email => (
                      <div key={email} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        <span className="text-sm">{email}</span>
                        <button 
                          onClick={() => removeRecipient(email)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to accompany your video"
                  rows={4}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={sendVideoEmail}
                  disabled={!videoURL || recipients.length === 0 || !subject || isSending}
                  className={`inline-flex items-center px-4 py-2 rounded-md ${
                    !videoURL || recipients.length === 0 || !subject || isSending
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={18} className="mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Video Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Talking Points */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <List size={18} className="text-blue-600 mr-2" />
              Talking Points
            </h2>
            
            <div className="mb-4">
              <div className="flex">
                <input
                  type="text"
                  value={newTalkingPoint}
                  onChange={(e) => setNewTalkingPoint(e.target.value)}
                  placeholder="Add a talking point"
                  className="flex-1 p-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addTalkingPoint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
            
            {talkingPoints.length > 0 ? (
              <ul className="space-y-2">
                {talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start bg-gray-50 p-2 rounded-md">
                    <span className="text-sm flex-1">{point}</span>
                    <button 
                      onClick={() => removeTalkingPoint(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">
                Add talking points to help you stay on track during your recording
              </p>
            )}
          </div>
          
          {/* Sent Videos */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Video size={18} className="text-blue-600 mr-2" />
              Recent Video Emails
            </h2>
            
            {sentVideos.length > 0 ? (
              <div className="space-y-3">
                {sentVideos.map(video => (
                  <div key={video.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{video.subject}</h3>
                        <p className="text-sm text-gray-500">To: {video.recipient}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {video.date.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(video.duration)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          video.viewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {video.viewed ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Viewed {video.viewCount} times
                            </>
                          ) : (
                            <>
                              <Clock size={12} className="mr-1" />
                              Not viewed yet
                            </>
                          )}
                        </span>
                      </div>
                      
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No video emails sent yet
              </p>
            )}
            
            {sentVideos.length > 0 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  View All Video Emails
                </button>
              </div>
            )}
          </div>
          
          {/* Quick Tips */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Tips for Great Video Emails</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Keep videos under 2 minutes for higher engagement</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Use good lighting and a clean background</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Start with a personalized greeting</span>
              </li>
              <li className="flex items-start">
                <CheckCircle size={16} className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>End with a clear call-to-action</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEmail;
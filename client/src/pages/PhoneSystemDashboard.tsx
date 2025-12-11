import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import GlassCard from '../components/GlassCard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  Phone,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Sparkles,
  Play,
  Pause,
  Square,
  Headphones,
  MessageSquare,
  Zap,
  Shield,
  Activity,
  Target,
  PhoneCall,
  PhoneOff,
  Camera,
  Monitor,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Call {
  id: string;
  caller: string;
  duration: number;
  status: 'completed' | 'missed' | 'ongoing' | 'voicemail';
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript?: string;
  recording?: string;
  gpt5Analysis?: {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    sentimentScore: number;
  };
}

interface PhoneStats {
  totalCalls: number;
  answeredCalls: number;
  averageCallDuration: number;
  callQuality: number;
  customerSatisfaction: number;
  aiAccuracy: number;
}

export default function PhoneSystemDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('calls');
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [callPurpose, setCallPurpose] = useState('sales');
  const [objectionType, setObjectionType] = useState('price');
  const [callRecording, setCallRecording] = useState('automatic');
  const [transcription, setTranscription] = useState('realtime');
  const [aiAnalysis, setAiAnalysis] = useState('enabled');
  const [voicemail, setVoicemail] = useState('transcribe');

  // WebRTC State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'ended'>('idle');
  const [remoteNumber, setRemoteNumber] = useState('');
  const [dialNumber, setDialNumber] = useState('');
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  // WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: calls = [], isLoading: callsLoading } = useQuery<Call[]>({
    queryKey: ['/api/phone/calls'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PhoneStats>({
    queryKey: ['/api/phone/stats'],
    refetchInterval: 30000,
  });

  const analyzeCall = async (call: Call) => {
    if (!call.transcript) return;

    setIsAnalyzing(true);
    try {
      const analysis = await gpt5Communication.analyzeContent(call.transcript, 'call-transcript');
      console.log('Call analysis:', analysis);
      // In real implementation, this would update the call record
    } catch (error) {
      console.error('Failed to analyze call:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'voicemail': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // WebRTC Functions
  const initializeMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMediaDevices(devices);

      const mics = devices.filter(device => device.kind === 'audioinput');
      const speakers = devices.filter(device => device.kind === 'audiooutput');
      const cameras = devices.filter(device => device.kind === 'videoinput');

      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
      if (speakers.length > 0 && !selectedSpeaker) setSelectedSpeaker(speakers[0].deviceId);
      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId);
    } catch (error) {
      console.error('Error initializing media devices:', error);
    }
  };

  const getUserMedia = async (audio: boolean = true, video: boolean = false) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audio ? { deviceId: selectedMic ? { exact: selectedMic } : undefined } : false,
        video: video ? { deviceId: selectedCamera ? { exact: selectedCamera } : undefined } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && video) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = () => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current?.connectionState);
      if (peerConnectionRef.current?.connectionState === 'connected') {
        setCallStatus('connected');
        setCallStartTime(new Date());
        startCallTimer();
      }
    };
  };

  const startCall = async (number: string, withVideo: boolean = false) => {
    try {
      setCallStatus('connecting');
      setRemoteNumber(number);
      setIsVideoEnabled(withVideo);

      // Get user media
      const stream = await getUserMedia(true, withVideo);

      // Create peer connection
      createPeerConnection();

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);

      // Send offer to remote peer via signaling server
      console.log('Call offer created:', offer);

      setIsCallActive(true);
      setCallStatus('ringing');

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('idle');
      alert('Failed to start call. Please check your microphone/camera permissions.');
    }
  };

  const answerCall = async () => {
    try {
      setCallStatus('connecting');

      // Get user media
      const stream = await getUserMedia(true, isVideoEnabled);

      // Create peer connection
      createPeerConnection();

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Create answer (in real implementation, this would be in response to an offer)
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);

      setIsCallActive(true);
      setCallStatus('connected');
      setCallStartTime(new Date());
      startCallTimer();

    } catch (error) {
      console.error('Error answering call:', error);
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // Reset state
    setIsCallActive(false);
    setCallStatus('ended');
    setCallDuration(0);
    setCallStartTime(null);

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    setTimeout(() => setCallStatus('idle'), 2000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (!isCallActive) return;

    try {
      if (isVideoEnabled) {
        // Turn off video
        localStreamRef.current?.getVideoTracks().forEach(track => track.stop());
        setIsVideoEnabled(false);
      } else {
        // Turn on video
        const videoStream = await getUserMedia(false, true);
        videoStream.getVideoTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, videoStream);
        });
        setIsVideoEnabled(true);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Initialize media devices on component mount
  useEffect(() => {
    initializeMediaDevices();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  const actionButtons = [
    <Button
      key="new-call"
      onClick={() => setShowCallModal(true)}
      className="bg-green-600 hover:bg-green-700"
      disabled={isCallActive}
    >
      <Phone className="h-4 w-4 mr-2" />
      Make Call
    </Button>,
    <Button
      key="video-call"
      onClick={() => setShowCallModal(true)}
      className="bg-blue-600 hover:bg-blue-700"
      disabled={isCallActive}
    >
      <Video className="h-4 w-4 mr-2" />
      Video Call
    </Button>,
    <Button
      key="ai-analysis"
      variant="outline"
      onClick={() => calls.length > 0 && analyzeCall(calls[0])}
      disabled={isAnalyzing || calls.length === 0}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalCalls}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Calls</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{Math.round((stats.answeredCalls / stats.totalCalls) * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Answer Rate</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.averageCallDuration}m</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.customerSatisfaction * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction</div>
      </div>
    </div>
  ) : null;

  return (
    <CommunicationDashboard
      appName="AI Voice Communication Center"
      appDescription="Advanced phone system with AI-powered call analysis, real-time transcription, and intelligent routing"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="calls">Call History</TabsTrigger>
          <TabsTrigger value="live">Live Calls</TabsTrigger>
          <TabsTrigger value="dialer">Dialer</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-6">
          {/* Call History */}
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Recent Calls
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {calls.map(call => (
                  <GlassCard
                    key={call.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          call.status === 'completed' ? 'bg-green-100' :
                          call.status === 'missed' ? 'bg-red-100' :
                          call.status === 'ongoing' ? 'bg-blue-100' : 'bg-yellow-100'
                        }`}>
                          <Phone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{call.caller}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {call.duration > 0 ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'No answer'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                        {call.sentiment && (
                          <Badge className={getSentimentColor(call.sentiment)}>
                            {call.sentiment}
                          </Badge>
                        )}
                        {call.gpt5Analysis && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-purple-600">AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Call Panel */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Call
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mb-6">
                    +1 (555) 123-4567
                  </div>

                  <div className="flex justify-center gap-4 mb-6">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button size="lg" variant="outline">
                      <Pause className="h-5 w-5" />
                    </Button>
                    <Button size="lg" className="bg-red-600 hover:bg-red-700">
                      <Square className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500">
                    {isRecording ? 'Recording active' : 'Recording paused'}
                  </div>
                </div>
              </CardContent>
            </GlassCard>

            {/* Real-time Transcript */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-y-auto">
                  <div className="space-y-2 text-sm">
                    <div className="text-blue-600 font-medium">Caller:</div>
                    <p className="text-gray-700 dark:text-gray-300">{transcript || 'Transcript will appear here during live calls...'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI Summary
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Target className="h-4 w-4 mr-1" />
                    Action Items
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="dialer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Dial */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Quick Dial
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quick-dial">Phone Number</Label>
                    <Input
                      id="quick-dial"
                      value={dialNumber}
                      onChange={(e) => setDialNumber(e.target.value)}
                      placeholder="Enter phone number..."
                      className="text-center text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
                      <Button
                        key={digit}
                        variant="outline"
                        className="h-12 text-lg font-semibold"
                        onClick={() => setDialNumber(prev => prev + digit.toString())}
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => startCall(dialNumber, false)}
                      disabled={!dialNumber.trim() || isCallActive}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      onClick={() => startCall(dialNumber, true)}
                      disabled={!dialNumber.trim() || isCallActive}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Video Call
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => setDialNumber('')}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    Clear Number
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            {/* Recent Contacts */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  {[
                    { name: 'John Smith', number: '+1 (555) 123-4567', type: 'Client' },
                    { name: 'Sarah Johnson', number: '+1 (555) 987-6543', type: 'Lead' },
                    { name: 'Mike Davis', number: '+1 (555) 456-7890', type: 'Partner' }
                  ].map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{contact.number}</div>
                        <Badge variant="outline" className="text-xs mt-1">{contact.type}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startCall(contact.number, false)}
                          disabled={isCallActive}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startCall(contact.number, true)}
                          disabled={isCallActive}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Call Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Call Quality Score</span>
                    <span className="font-semibold">{Math.round(stats.callQuality * 100)}%</span>
                  </div>
                  <Progress value={stats.callQuality * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Analysis Accuracy</span>
                    <span className="font-semibold">{Math.round(stats.aiAccuracy * 100)}%</span>
                  </div>
                  <Progress value={stats.aiAccuracy * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-semibold">{Math.round(stats.customerSatisfaction * 100)}%</span>
                  </div>
                  <Progress value={stats.customerSatisfaction * 100} className="h-2" />
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Call Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak Call Hours</span>
                    <span className="font-semibold">9 AM - 11 AM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Busiest Day</span>
                    <span className="font-semibold">Wednesday</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Handle Time</span>
                    <span className="font-semibold">4.2 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">First Call Resolution</span>
                    <span className="font-semibold">78%</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Call Script Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="call-purpose">Call Purpose</Label>
                    <Select value={callPurpose} onValueChange={setCallPurpose}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales Call</SelectItem>
                        <SelectItem value="support">Support Call</SelectItem>
                        <SelectItem value="followup">Follow-up Call</SelectItem>
                        <SelectItem value="survey">Customer Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prospect-info">Prospect Information</Label>
                    <Textarea
                      id="prospect-info"
                      placeholder="Enter prospect details, previous interactions, etc."
                      rows={4}
                    />
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Call Script
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Objection Handler
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="objection">Common Objection</Label>
                    <Select value={objectionType} onValueChange={setObjectionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price Too High</SelectItem>
                        <SelectItem value="competition">Using Competitor</SelectItem>
                        <SelectItem value="timing">Not Right Time</SelectItem>
                        <SelectItem value="features">Missing Features</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="context">Call Context</Label>
                    <Textarea
                      id="context"
                      placeholder="Describe the current call situation..."
                      rows={3}
                    />
                  </div>
                  <Button className="w-full" variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Response
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio/Video Devices */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Audio & Video Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Microphone
                    </Label>
                    <Select value={selectedMic} onValueChange={setSelectedMic}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaDevices.filter(device => device.kind === 'audioinput').map(device => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Headphones className="h-4 w-4" />
                      Speaker
                    </Label>
                    <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select speaker" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaDevices.filter(device => device.kind === 'audiooutput').map(device => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Camera
                    </Label>
                    <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaDevices.filter(device => device.kind === 'videoinput').map(device => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={initializeMediaDevices}
                    variant="outline"
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Refresh Devices
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            {/* Call Settings */}
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Call Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Call Recording</Label>
                    <Select value={callRecording} onValueChange={setCallRecording}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Transcription</Label>
                    <Select value={transcription} onValueChange={setTranscription}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="postcall">Post-Call</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Analysis</Label>
                    <Select value={aiAnalysis} onValueChange={setAiAnalysis}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Voicemail</Label>
                    <Select value={voicemail} onValueChange={setVoicemail}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcribe">Transcribe & Analyze</SelectItem>
                        <SelectItem value="record">Record Only</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>

          {/* Permissions & Security */}
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Mic className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Microphone</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {navigator.mediaDevices ? 'Granted' : 'Not Available'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Camera</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {navigator.mediaDevices ? 'Granted' : 'Not Available'}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-medium">Screen Share</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {'Available'}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Browser Permissions Required
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                      To use calling features, please ensure your browser has permission to access your microphone and camera.
                    </p>
                    <Button variant="outline" size="sm">
                      Check Permissions
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Call Modal - Dialing Interface */}
      <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Make a Call
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="text-center text-lg font-mono"
              />
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => setDialNumber(prev => prev + digit.toString())}
                >
                  {digit}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  startCall(dialNumber, false);
                  setShowCallModal(false);
                }}
                disabled={!dialNumber.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </Button>
              <Button
                onClick={() => {
                  startCall(dialNumber, true);
                  setShowCallModal(false);
                }}
                disabled={!dialNumber.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setDialNumber('')}
                className="text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Call Interface */}
      {isCallActive && (
        <Dialog open={isCallActive} onOpenChange={() => {}}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="space-y-6">
              {/* Call Status Header */}
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  callStatus === 'connected' ? 'text-green-600' :
                  callStatus === 'connecting' ? 'text-yellow-600' :
                  callStatus === 'ringing' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {callStatus === 'connected' ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` :
                   callStatus === 'connecting' ? 'Connecting...' :
                   callStatus === 'ringing' ? 'Ringing...' : 'Call Ended'}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  {remoteNumber}
                </div>
                <Badge className={`mt-2 ${
                  callStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  callStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  callStatus === 'ringing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {callStatus}
                </Badge>
              </div>

              {/* Video Interface */}
              {isVideoEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">You</Label>
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{remoteNumber}</Label>
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? "destructive" : "outline"}
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>

                {isVideoEnabled && (
                  <Button
                    onClick={toggleVideo}
                    variant={!isVideoEnabled ? "destructive" : "outline"}
                    size="lg"
                    className="w-16 h-16 rounded-full"
                  >
                    {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </Button>
                )}

                <Button
                  onClick={toggleSpeaker}
                  variant={!isSpeakerOn ? "destructive" : "outline"}
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  {!isSpeakerOn ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>

                <Button
                  onClick={endCall}
                  variant="destructive"
                  size="lg"
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>

              {/* Call Features */}
              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Record
                </Button>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Notes
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Caller</Label>
                  <div className="font-medium">{selectedCall.caller}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</Label>
                  <div className="font-medium">
                    {selectedCall.duration > 0 ? `${Math.floor(selectedCall.duration / 60)}:${(selectedCall.duration % 60).toString().padStart(2, '0')}` : 'No answer'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedCall.status)}>
                    {selectedCall.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sentiment</Label>
                  {selectedCall.sentiment && (
                    <Badge className={getSentimentColor(selectedCall.sentiment)}>
                      {selectedCall.sentiment}
                    </Badge>
                  )}
                </div>
              </div>

              {selectedCall.transcript && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Transcript</Label>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm">{selectedCall.transcript}</p>
                  </div>
                </div>
              )}

              {selectedCall.gpt5Analysis && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Analysis
                  </Label>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-sm mb-1">Summary</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCall.gpt5Analysis.summary}</p>
                    </div>

                    <div>
                      <div className="font-medium text-sm mb-1">Key Points</div>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {selectedCall.gpt5Analysis.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-medium text-sm mb-1">Action Items</div>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {selectedCall.gpt5Analysis.actionItems.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}
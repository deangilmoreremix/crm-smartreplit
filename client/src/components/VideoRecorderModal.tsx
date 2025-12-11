import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Camera,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Save,
  X
} from 'lucide-react';

interface VideoRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (videoData: {
    title: string;
    recipientName: string;
    recipientEmail: string;
    company: string;
    script: string;
    videoBlob: Blob;
  }) => void;
}

export default function VideoRecorderModal({ open, onOpenChange, onSave }: VideoRecorderModalProps) {
  const { isDark } = useTheme();
  const { 
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    startRecording,
    stopRecording,
    isRecording
  } = useVideoCall();

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [company, setCompany] = useState('');
  const [script, setScript] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (open) {
      initializeCamera();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [open]);

  // Update video preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingState('idle');
    setRecordingDuration(0);
    setRecordedBlob(null);
  };

  const handleStartRecording = async () => {
    try {
      const stream = streamRef.current || videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setRecordingState('stopped');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setRecordingState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handlePlayback = () => {
    if (playbackRef.current && recordedBlob) {
      if (isPlaying) {
        playbackRef.current.pause();
        setIsPlaying(false);
      } else {
        const url = URL.createObjectURL(recordedBlob);
        playbackRef.current.src = url;
        playbackRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    setRecordedBlob(null);
    setRecordingState('idle');
    setRecordingDuration(0);
    setIsPlaying(false);
    if (playbackRef.current) {
      playbackRef.current.src = '';
    }
  };

  const handleSave = () => {
    if (recordedBlob && onSave) {
      onSave({
        title,
        recipientName,
        recipientEmail,
        company,
        script,
        videoBlob: recordedBlob
      });
      onOpenChange(false);
      // Reset form
      setTitle('');
      setRecipientName('');
      setRecipientEmail('');
      setCompany('');
      setScript('');
      handleReset();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Video Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Preview/Playback */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {recordingState === 'stopped' && recordedBlob ? (
              <video
                ref={playbackRef}
                className="w-full h-full object-cover"
                onEnded={() => setIsPlaying(false)}
                data-testid="video-playback"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
                data-testid="video-preview"
              />
            )}

            {/* Recording Indicator */}
            {recordingState === 'recording' && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">REC {formatDuration(recordingDuration)}</span>
              </div>
            )}

            {/* Recording Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-3">
              {recordingState === 'idle' || recordingState === 'stopped' ? (
                <Button
                  onClick={handleStartRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 rounded-full w-16 h-16"
                  data-testid="button-start-recording"
                >
                  <Video size={24} />
                </Button>
              ) : (
                <Button
                  onClick={handleStopRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 rounded-full w-16 h-16"
                  data-testid="button-stop-recording"
                >
                  <Square size={24} />
                </Button>
              )}

              {recordingState === 'stopped' && (
                <>
                  <Button
                    onClick={handlePlayback}
                    size="lg"
                    variant="secondary"
                    className="rounded-full w-12 h-12"
                    data-testid="button-playback"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button
                    onClick={handleReset}
                    size="lg"
                    variant="secondary"
                    className="rounded-full w-12 h-12"
                    data-testid="button-reset"
                  >
                    <RotateCcw size={20} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                placeholder="Enter video title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-video-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-name">Recipient Name</Label>
              <Input
                id="recipient-name"
                placeholder="e.g., John Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                data-testid="input-recipient-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="e.g., john@company.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                data-testid="input-recipient-email"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="e.g., Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                data-testid="input-company"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="video-script">Script / Notes</Label>
              <Textarea
                id="video-script"
                placeholder="Add your script or notes..."
                rows={4}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                data-testid="textarea-video-script"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                handleReset();
              }}
              data-testid="button-cancel"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!recordedBlob || !title || !recipientEmail}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-video"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Video Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Demo Recorder Service
 * Records application features and generates GIFs/videos for demos
 */

export interface RecordingSession {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  frames: ImageData[];
  fps: number;
  status: 'recording' | 'paused' | 'stopped' | 'processing' | 'completed';
  format: 'gif' | 'mp4' | 'webm';
}

export interface DemoFeature {
  id: string;
  name: string;
  description: string;
  recordingId: string;
  autoTrigger: boolean;
  triggerSelector?: string;
  thumbnail?: string;
  duration: number;
  createdAt: string;
}

class DemoRecorderService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private currentSession: RecordingSession | null = null;
  private frameRate: number = 30;
  private isRecording: boolean = false;
  private frameCount: number = 0;
  private features: Map<string, DemoFeature> = new Map();

  constructor() {
    this.initializeCanvas();
  }

  private initializeCanvas(): void {
    if (typeof document === 'undefined') return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  async startRecording(sessionName: string, format: 'gif' | 'mp4' | 'webm' = 'webm'): Promise<RecordingSession> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Check if browser supports screen capture
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture not supported in this browser');
      }

      // Get screen capture stream
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        } as any,
        audio: false
      });

      this.currentSession = {
        id: `session-${Date.now()}`,
        name: sessionName,
        description: '',
        startTime: Date.now(),
        frames: [],
        fps: this.frameRate,
        status: 'recording',
        format
      };

      this.isRecording = true;
      this.frameCount = 0;

      // Setup media recorder for video formats
      if (format !== 'gif') {
        this.recorder = new MediaRecorder(this.stream, {
          mimeType: 'video/webm'
        });

        const chunks: Blob[] = [];
        this.recorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        this.recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          this.handleRecordingComplete(blob, format);
        };

        this.recorder.start();
      } else {
        // For GIF, capture frames
        this.captureFrames();
      }

      console.log(`🎬 Recording started: ${sessionName}`);
      return this.currentSession;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  private captureFrames(): void {
    if (!this.isRecording || !this.currentSession) return;

    const captureFrame = async () => {
      try {
        // Try to capture canvas using canvas API directly
        if (this.canvas && this.ctx) {
          const imageData = this.ctx.getImageData(
            0, 0, this.canvas.width, this.canvas.height
          );
          
          if (imageData && this.currentSession) {
            this.currentSession.frames.push(imageData);
            this.frameCount++;
          }
        }
      } catch (error) {
        console.warn('Failed to capture frame:', error);
      }

      if (this.isRecording) {
        setTimeout(captureFrame, 1000 / this.frameRate);
      }
    };

    captureFrame();
  }

  stopRecording(): RecordingSession | null {
    if (!this.isRecording || !this.currentSession) {
      throw new Error('No recording in progress');
    }

    this.isRecording = false;

    if (this.recorder) {
      this.recorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.status = 'stopped';

    console.log(`⏹️ Recording stopped: ${this.currentSession.name}`);
    return this.currentSession;
  }

  pauseRecording(): void {
    if (!this.isRecording) {
      throw new Error('No recording in progress');
    }

    this.isRecording = false;
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
    }

    if (this.currentSession) {
      this.currentSession.status = 'paused';
    }

    console.log('⏸️ Recording paused');
  }

  resumeRecording(): void {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.isRecording = true;
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
    }

    if (this.currentSession) {
      this.currentSession.status = 'recording';
    }

    console.log('▶️ Recording resumed');
  }

  private async handleRecordingComplete(blob: Blob, format: string): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.status = 'processing';

    try {
      if (format === 'gif') {
        // Convert frames to GIF
        const gif = await this.framesToGif(this.currentSession.frames);
        await this.downloadBlob(gif, `${this.currentSession.name}.gif`);
      } else {
        // Download video
        await this.downloadBlob(blob, `${this.currentSession.name}.${format === 'mp4' ? 'webm' : format}`);
      }

      this.currentSession.status = 'completed';
      console.log(`✅ Recording processed: ${this.currentSession.name}`);
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.currentSession.status = 'stopped';
    }
  }

  private async framesToGif(frames: ImageData[]): Promise<Blob> {
    // Simple GIF encoding (note: production would use a library like gif.js)
    // This is a placeholder that returns a blob
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (frames.length > 0) {
      canvas.width = frames[0].width;
      canvas.height = frames[0].height;

      if (ctx && frames[0]) {
        ctx.putImageData(frames[0], 0, 0);
      }
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: 'image/gif' }));
      }, 'image/gif');
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  registerFeature(feature: Omit<DemoFeature, 'id' | 'createdAt'>): DemoFeature {
    const demoFeature: DemoFeature = {
      ...feature,
      id: `feature-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.features.set(demoFeature.id, demoFeature);

    if (feature.autoTrigger && feature.triggerSelector) {
      this.setupAutoTrigger(demoFeature);
    }

    console.log(`📍 Feature registered: ${demoFeature.name}`);
    return demoFeature;
  }

  private setupAutoTrigger(feature: DemoFeature): void {
    if (!feature.triggerSelector) return;

    const elements = document.querySelectorAll(feature.triggerSelector);
    elements.forEach((element) => {
      element.addEventListener('click', async () => {
        console.log(`🎯 Auto-trigger activated for: ${feature.name}`);
        // Trigger recording logic here
      });
    });
  }

  getFeatures(): DemoFeature[] {
    return Array.from(this.features.values());
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  deleteFeature(featureId: string): boolean {
    return this.features.delete(featureId);
  }
}

export const demoRecorder = new DemoRecorderService();


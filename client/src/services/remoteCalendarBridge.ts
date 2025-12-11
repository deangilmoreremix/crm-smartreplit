// Remote Calendar Bridge Service
// Manages communication between CRM and remote calendar module

export interface RemoteCalendarStatus {
  isConnected: boolean;
  lastSync: Date | null;
  appointmentCount: number;
  errorMessage?: string;
  connectionAttempts: number;
}

export interface CalendarMessage {
  type: string;
  data: any;
  source: string;
  timestamp: number;
}

export interface CRMAppointment {
  id: string;
  title: string;
  contactId?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  date: string;
  endDate: string;
  duration: number; // in minutes
  type: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  location?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CRMCalendarData {
  appointments: CRMAppointment[];
  availableSlots: {
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
  }[];
}

export class RemoteCalendarBridge {
  private iframe: HTMLIFrameElement | null = null;
  private status: RemoteCalendarStatus;
  private statusCallback: (status: RemoteCalendarStatus) => void;
  private maxAttempts = 3;
  private retryDelay = 2000;
  private messageHandler: (event: MessageEvent) => void;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private origin: string;

  constructor(statusCallback: (status: RemoteCalendarStatus) => void) {
    this.statusCallback = statusCallback;
    this.origin = 'https://ai-calendar-applicat-qshp.bolt.host';
    this.status = {
      isConnected: false,
      lastSync: null,
      appointmentCount: 0,
      connectionAttempts: 0
    };
    
    // Store bound message handler for proper cleanup
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
    
    console.log('🔧 Calendar Bridge initialized for origin:', this.origin);
  }

  setIframe(iframe: HTMLIFrameElement | null) {
    this.iframe = iframe;
    console.log('📺 Calendar iframe set:', !!iframe);
  }

  private handleMessage(event: MessageEvent) {
    // Security check for allowed origins
    const allowedOrigins = [
      'https://ai-calendar-applicat-qshp.bolt.host',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!allowedOrigins.some(origin => event.origin.includes(origin.replace('https://', '').replace('http://', '')))) {
      console.log('❌ Rejected message from unauthorized origin:', event.origin);
      return;
    }

    try {
      const message: CalendarMessage = event.data;
      if (!message || message.source !== 'REMOTE_CALENDAR') return;

      console.log('📨 Calendar bridge message received:', message.type, message.data);

      switch (message.type) {
        case 'REMOTE_READY':
          console.log('🎯 Remote calendar ready, initializing...');
          this.updateStatus({ connectionAttempts: this.status.connectionAttempts + 1 });
          this.initializeCalendar();
          break;
          
        case 'CRM_INIT_COMPLETE':
          this.updateStatus({
            isConnected: true,
            lastSync: new Date(),
            appointmentCount: message.data?.appointmentsReceived || 0
          });
          console.log('✅ Remote calendar initialized successfully');
          this.triggerCallback('REMOTE_READY');
          break;
          
        case 'BRIDGE_READY':
          // Bridge code is loaded and ready
          this.updateStatus({ connectionAttempts: this.status.connectionAttempts + 1 });
          setTimeout(() => this.initializeCalendar(), 500);
          break;
          
        case 'APPOINTMENT_CREATED':
        case 'APPOINTMENT_UPDATED':
        case 'APPOINTMENT_DELETED':
        case 'APPOINTMENT_STATUS_CHANGED':
          this.updateStatus({ lastSync: new Date() });
          this.triggerCallback(message.type, message.data);
          break;

        case 'REQUEST_APPOINTMENTS':
          this.triggerCallback('REQUEST_APPOINTMENTS');
          break;

        case 'NAVIGATE':
          this.triggerCallback('NAVIGATE', message.data);
          break;

        case 'NAVIGATE_BACK':
          this.triggerCallback('NAVIGATE_BACK');
          break;

        case 'NAVIGATE_TO_DASHBOARD':
          this.triggerCallback('NAVIGATE_TO_DASHBOARD');
          break;
          
        default:
          console.log('📨 Unhandled calendar message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Calendar bridge message handling error:', error);
      this.updateStatus({ errorMessage: `Message handling error: ${error}` });
    }
  }

  private updateStatus(updates: Partial<RemoteCalendarStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallback(this.status);
  }

  private triggerCallback(type: string, data?: any) {
    const callback = this.messageCallbacks.get(type);
    if (callback) {
      try {
        callback(data);
      } catch (error) {
        console.error('Calendar callback failed:', error);
      }
    }
  }

  private initializeCalendar() {
    if (!this.iframe?.contentWindow) {
      console.warn('⚠️ Calendar: No iframe content window available');
      return;
    }

    const initMessage: CalendarMessage = {
      type: 'CRM_INIT',
      data: {
        origin: window.location.origin,
        crmInfo: {
          name: 'SmartCRM Calendar Integration',
          version: '1.0.0',
          features: ['appointments', 'calendar', 'moderation', 'navigation']
        },
        capabilities: {
          canCreateAppointments: true,
          canUpdateAppointments: true,
          canDeleteAppointments: true,
          canModerateCalendar: true,
          canSync: true
        }
      },
      source: 'CRM_SYSTEM',
      timestamp: Date.now()
    };

    console.log('📤 Initializing calendar with CRM data:', initMessage);
    this.iframe.contentWindow.postMessage(initMessage, this.origin);

    // Also try simple postMessage format in case the remote app expects a different format
    setTimeout(() => {
      if (this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'SET_THEME',
          theme: 'light'
        }, '*');
        
        this.iframe.contentWindow.postMessage({
          type: 'INIT_CRM_BRIDGE',
          data: initMessage.data
        }, '*');
      }
    }, 500);
  }

  // Public API methods
  onMessage(type: string, handler: (data: any) => void) {
    this.messageCallbacks.set(type, handler);
  }

  sendMessage(type: string, data: any) {
    if (!this.iframe?.contentWindow) {
      console.warn('⚠️ Calendar Bridge: No iframe reference available');
      return;
    }

    const message: CalendarMessage = {
      type,
      data,
      source: 'CRM_SYSTEM',
      timestamp: Date.now()
    };

    console.log('📤 Calendar bridge sending message:', message);
    this.iframe.contentWindow.postMessage(message, this.origin);
  }

  // Calendar-specific methods
  syncAppointments(appointments: CRMAppointment[]) {
    this.sendMessage('APPOINTMENTS_SYNC', { appointments });
  }

  notifyAppointmentCreated(appointment: CRMAppointment) {
    this.sendMessage('LOCAL_APPOINTMENT_CREATED', appointment);
  }

  notifyAppointmentUpdated(appointment: CRMAppointment) {
    this.sendMessage('LOCAL_APPOINTMENT_UPDATED', appointment);
  }

  notifyAppointmentDeleted(appointmentId: string) {
    this.sendMessage('LOCAL_APPOINTMENT_DELETED', { id: appointmentId });
  }

  // Navigation helpers
  sendNavigationCapabilities() {
    this.sendMessage('NAVIGATION_AVAILABLE', {
      routes: [
        { path: '/', name: 'Dashboard' },
        { path: '/calendar', name: 'Calendar' },
        { path: '/appointments', name: 'Appointments' },
        { path: '/contacts', name: 'Contacts' },
        { path: '/pipeline', name: 'Pipeline' },
        { path: '/tasks', name: 'Tasks' }
      ]
    });
  }

  // Request data from remote
  requestCalendarData() {
    this.sendMessage('REQUEST_CALENDAR_DATA', {});
  }

  // Cleanup
  disconnect() {
    window.removeEventListener('message', this.messageHandler);
    this.messageCallbacks.clear();
    this.iframe = null;
    console.log('🔌 Calendar bridge disconnected');
  }

  // Status getters
  getStatus(): RemoteCalendarStatus {
    return { ...this.status };
  }

  isReady(): boolean {
    return this.status.isConnected;
  }
}
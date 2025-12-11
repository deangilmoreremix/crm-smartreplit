import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  MobileLayoutConfig, 
  DeviceInfo, 
  ViewportConfig, 
  OfflineData, 
  SyncStatus,
  MobileNotification,
  TouchEvent
} from '../types/mobile';

interface MobileState {
  // Device and Viewport
  deviceInfo: DeviceInfo | null;
  viewport: ViewportConfig;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
  
  // Layout and UI
  layoutConfig: MobileLayoutConfig | null;
  sidebarOpen: boolean;
  bottomNavVisible: boolean;
  keyboardVisible: boolean;
  
  // Offline and Sync
  isOnline: boolean;
  offlineData: OfflineData[];
  syncStatus: SyncStatus;
  
  // Notifications
  notifications: MobileNotification[];
  
  // Touch and Gestures
  touchEvents: TouchEvent[];
  gesturesEnabled: boolean;
  
  // Performance
  performanceMode: 'auto' | 'power_save' | 'performance';
  lazyLoadingEnabled: boolean;
  
  // Actions
  // Device Detection
  detectDevice: () => void;
  updateViewport: (viewport: Partial<ViewportConfig>) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  
  // Layout Management
  setLayoutConfig: (config: MobileLayoutConfig) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setBottomNavVisible: (visible: boolean) => void;
  setKeyboardVisible: (visible: boolean) => void;
  
  // Offline Management
  setOnlineStatus: (online: boolean) => void;
  addOfflineData: (data: Omit<OfflineData, 'id' | 'timestamp' | 'synced' | 'retryCount'>) => void;
  removeOfflineData: (id: string) => void;
  syncOfflineData: () => Promise<void>;
  clearSyncedData: () => void;
  
  // Notifications
  addNotification: (notification: Omit<MobileNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Touch and Gestures
  addTouchEvent: (event: Omit<TouchEvent, 'id' | 'timestamp'>) => void;
  clearTouchEvents: () => void;
  setGesturesEnabled: (enabled: boolean) => void;
  
  // Performance
  setPerformanceMode: (mode: 'auto' | 'power_save' | 'performance') => void;
  setLazyLoading: (enabled: boolean) => void;
  
  // Responsive Helpers
  getBreakpoint: () => 'sm' | 'md' | 'lg' | 'xl';
  isBreakpoint: (breakpoint: 'sm' | 'md' | 'lg' | 'xl') => boolean;
  isMobileSize: () => boolean;
  isTabletSize: () => boolean;
  isDesktopSize: () => boolean;
}

export const useMobileStore = create<MobileState>()(
  devtools(
    (set, get) => ({
      // Initial State
      deviceInfo: null,
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
        orientation: 'portrait',
        scale: 1,
        safeArea: { top: 0, bottom: 0, left: 0, right: 0 }
      },
      isTouch: false,
      isMobile: false,
      isTablet: false,
      orientation: 'portrait',
      layoutConfig: null,
      sidebarOpen: false,
      bottomNavVisible: true,
      keyboardVisible: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      offlineData: [],
      syncStatus: {
        isOnline: true,
        lastSync: new Date(),
        pendingChanges: 0,
        syncInProgress: false,
        errors: []
      },
      notifications: [],
      touchEvents: [],
      gesturesEnabled: true,
      performanceMode: 'auto',
      lazyLoadingEnabled: true,

      // Device Detection
      detectDevice: () => {
        if (typeof window === 'undefined') return;

        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Detect platform
        let detectedPlatform: 'ios' | 'android' | 'web' = 'web';
        if (/iPad|iPhone|iPod/.test(userAgent)) {
          detectedPlatform = 'ios';
        } else if (/Android/.test(userAgent)) {
          detectedPlatform = 'android';
        }

        // Detect device type
        let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop';
        if (width <= 768) {
          deviceType = 'phone';
        } else if (width <= 1024) {
          deviceType = 'tablet';
        }

        // Detect capabilities
        const capabilities = {
          touch: 'ontouchstart' in window,
          camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          location: !!navigator.geolocation,
          push: 'PushManager' in window,
          biometric: 'credentials' in navigator,
          nfc: 'nfc' in navigator
        };

        const deviceInfo: DeviceInfo = {
          platform: detectedPlatform,
          type: deviceType,
          screenSize: {
            width,
            height,
            density: window.devicePixelRatio || 1
          },
          capabilities,
          browser: {
            name: getBrowserName(),
            version: getBrowserVersion(),
            mobile: /Mobi|Android/i.test(userAgent)
          }
        };

        set({
          deviceInfo,
          isTouch: capabilities.touch,
          isMobile: deviceType === 'phone',
          isTablet: deviceType === 'tablet',
          orientation: width > height ? 'landscape' : 'portrait'
        });
      },

      updateViewport: (viewport) => {
        set((state) => ({
          viewport: { ...state.viewport, ...viewport }
        }));
      },

      setOrientation: (orientation) => {
        set({ orientation });
      },

      // Layout Management
      setLayoutConfig: (config) => {
        set({ layoutConfig: config });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setBottomNavVisible: (visible) => {
        set({ bottomNavVisible: visible });
      },

      setKeyboardVisible: (visible) => {
        set({ keyboardVisible: visible });
      },

      // Offline Management
      setOnlineStatus: (online) => {
        set((state) => ({
          isOnline: online,
          syncStatus: {
            ...state.syncStatus,
            isOnline: online
          }
        }));
      },

      addOfflineData: (data) => {
        const offlineItem: OfflineData = {
          ...data,
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          synced: false,
          retryCount: 0
        };

        set((state) => ({
          offlineData: [...state.offlineData, offlineItem],
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: state.syncStatus.pendingChanges + 1
          }
        }));
      },

      removeOfflineData: (id) => {
        set((state) => ({
          offlineData: state.offlineData.filter(item => item.id !== id),
          syncStatus: {
            ...state.syncStatus,
            pendingChanges: Math.max(0, state.syncStatus.pendingChanges - 1)
          }
        }));
      },

      syncOfflineData: async () => {
        const { offlineData, isOnline } = get();
        
        if (!isOnline || offlineData.length === 0) return;

        set((state) => ({
          syncStatus: { ...state.syncStatus, syncInProgress: true }
        }));

        try {
          // Simulate sync process
          for (const item of offlineData) {
            if (!item.synced) {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Mark as synced
              set((state) => ({
                offlineData: state.offlineData.map(data =>
                  data.id === item.id ? { ...data, synced: true } : data
                )
              }));
            }
          }

          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              syncInProgress: false,
              lastSync: new Date(),
              pendingChanges: 0
            }
          }));

          // Clear synced data after successful sync
          get().clearSyncedData();
        } catch (error) {
          console.error('Sync failed:', error);
          set((state) => ({
            syncStatus: {
              ...state.syncStatus,
              syncInProgress: false,
              errors: [...state.syncStatus.errors, {
                id: `error_${Date.now()}`,
                type: 'network',
                message: 'Failed to sync offline data',
                data: offlineData,
                timestamp: new Date(),
                resolved: false
              }]
            }
          }));
        }
      },

      clearSyncedData: () => {
        set((state) => ({
          offlineData: state.offlineData.filter(item => !item.synced)
        }));
      },

      // Notifications
      addNotification: (notification) => {
        const newNotification: MobileNotification = {
          ...notification,
          id: `notification_${Date.now()}`,
          timestamp: new Date()
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));

        // Auto-remove non-persistent notifications
        if (!notification.persistent && notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Touch and Gestures
      addTouchEvent: (event) => {
        const touchEvent: TouchEvent = {
          ...event,
          id: `touch_${Date.now()}`,
          timestamp: Date.now()
        };

        set((state) => ({
          touchEvents: [...state.touchEvents.slice(-9), touchEvent] // Keep last 10 events
        }));
      },

      clearTouchEvents: () => {
        set({ touchEvents: [] });
      },

      setGesturesEnabled: (enabled) => {
        set({ gesturesEnabled: enabled });
      },

      // Performance
      setPerformanceMode: (mode) => {
        set({ 
          performanceMode: mode,
          lazyLoadingEnabled: mode !== 'performance'
        });
      },

      setLazyLoading: (enabled) => {
        set({ lazyLoadingEnabled: enabled });
      },

      // Responsive Helpers
      getBreakpoint: () => {
        const { viewport } = get();
        const width = viewport.width;
        
        if (width < 640) return 'sm';
        if (width < 768) return 'md';
        if (width < 1024) return 'lg';
        return 'xl';
      },

      isBreakpoint: (breakpoint) => {
        return get().getBreakpoint() === breakpoint;
      },

      isMobileSize: () => {
        return get().viewport.width < 768;
      },

      isTabletSize: () => {
        const width = get().viewport.width;
        return width >= 768 && width < 1024;
      },

      isDesktopSize: () => {
        return get().viewport.width >= 1024;
      }
    }),
    {
      name: 'mobile-store',
    }
  )
);

// Helper functions
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
  return match ? match[2] : 'Unknown';
}

// Auto-initialize device detection and event listeners
if (typeof window !== 'undefined') {
  const store = useMobileStore.getState();
  
  // Initial device detection
  store.detectDevice();
  
  // Listen for online/offline events
  window.addEventListener('online', () => {
    store.setOnlineStatus(true);
    store.syncOfflineData();
  });
  
  window.addEventListener('offline', () => {
    store.setOnlineStatus(false);
  });
  
  // Listen for viewport changes
  window.addEventListener('resize', () => {
    store.updateViewport({
      width: window.innerWidth,
      height: window.innerHeight
    });
    store.setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  });
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      store.updateViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
      store.setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    }, 100);
  });
  
  // Listen for keyboard events on mobile
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', () => {
      const keyboard = window.innerHeight - (window.visualViewport?.height || window.innerHeight);
      store.setKeyboardVisible(keyboard > 150);
    });
  }
}

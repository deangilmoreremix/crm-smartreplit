// Mobile Responsiveness Types
export interface MobileLayoutConfig {
  id: string;
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  layout: {
    mobile: LayoutConfig;
    tablet: LayoutConfig;
    desktop: LayoutConfig;
  };
  navigation: MobileNavigationConfig;
  gestures: GestureConfig;
  performance: MobilePerformanceConfig;
}

export interface LayoutConfig {
  columns: number;
  spacing: number;
  padding: number;
  components: ComponentLayout[];
  sidebar: SidebarConfig;
  header: HeaderConfig;
}

export interface ComponentLayout {
  id: string;
  component: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  responsive: {
    hidden: string[]; // breakpoints where component is hidden
    reorder: number; // order on mobile
    collapse: boolean; // can be collapsed on mobile
  };
  mobileOverrides?: Partial<ComponentLayout>;
}

export interface SidebarConfig {
  position: 'left' | 'right' | 'hidden';
  width: number;
  collapsible: boolean;
  overlay: boolean; // overlay on mobile
  persistent: boolean; // always visible on desktop
}

export interface HeaderConfig {
  height: number;
  sticky: boolean;
  showTitle: boolean;
  showBreadcrumbs: boolean;
  showSearch: boolean;
  compact: boolean; // compact mode for mobile
}

export interface MobileNavigationConfig {
  type: 'bottom_tabs' | 'hamburger' | 'drawer' | 'hybrid';
  items: NavigationItem[];
  maxItems: number; // max items in bottom nav before "more"
  gestures: {
    swipeToNavigate: boolean;
    pullToRefresh: boolean;
    swipeBack: boolean;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  priority: number; // higher priority items show first on mobile
  hideOnMobile?: boolean;
}

export interface GestureConfig {
  enabled: boolean;
  swipeThreshold: number;
  longPressDelay: number;
  gestures: {
    swipeToDelete: boolean;
    pinchToZoom: boolean;
    pullToRefresh: boolean;
    swipeToNavigate: boolean;
    doubleTapToSelect: boolean;
  };
}

export interface MobilePerformanceConfig {
  lazyLoading: boolean;
  virtualScrolling: boolean;
  imageOptimization: boolean;
  caching: {
    enabled: boolean;
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    duration: number;
  };
  offline: {
    enabled: boolean;
    storage: 'localStorage' | 'indexedDB';
    syncStrategy: 'immediate' | 'wifi-only' | 'manual';
  };
}

// Touch and Gesture Types
export interface TouchEvent {
  id: string;
  type: 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'pinch' | 'pan';
  position: { x: number; y: number };
  delta?: { x: number; y: number };
  velocity?: { x: number; y: number };
  scale?: number;
  timestamp: number;
  target: string;
}

export interface SwipeDirection {
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  duration: number;
  velocity: number;
}

// Mobile-Specific UI Components
export interface MobileModal {
  id: string;
  type: 'bottom_sheet' | 'full_screen' | 'center' | 'slide_up';
  content: React.ReactNode;
  height?: 'auto' | 'half' | 'full' | number;
  dismissible: boolean;
  backdrop: boolean;
  animation: 'slide' | 'fade' | 'bounce';
  handles: boolean; // drag handles for bottom sheets
}

export interface MobileCard {
  id: string;
  title: string;
  content: React.ReactNode;
  actions?: MobileAction[];
  swipeActions?: SwipeAction[];
  expandable: boolean;
  priority: number; // for mobile reordering
}

export interface MobileAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
  showOnMobile: boolean;
}

export interface SwipeAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  direction: 'left' | 'right';
  color: string;
  dangerous?: boolean;
}

// Mobile Form Types
export interface MobileFormConfig {
  id: string;
  fields: MobileFormField[];
  layout: 'single_column' | 'smart_column';
  keyboard: KeyboardConfig;
  validation: MobileValidationConfig;
  autosave: boolean;
  progressIndicator: boolean;
}

export interface MobileFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'multiselect' | 'date' | 'time' | 'datetime' | 'textarea' | 'file' | 'camera';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: FieldValidation[];
  mobileOptions?: {
    keyboard: 'default' | 'numeric' | 'phone-pad' | 'email-address' | 'url';
    autoComplete: string;
    autoFocus: boolean;
    clearButton: boolean;
    showCounter: boolean;
  };
}

export interface FieldValidation {
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface KeyboardConfig {
  type: 'default' | 'adaptive';
  returnKeyType: 'done' | 'next' | 'send' | 'go';
  autoCorrect: boolean;
  autoCapitalize: 'none' | 'sentences' | 'words' | 'characters';
}

export interface MobileValidationConfig {
  realTime: boolean;
  showErrors: 'inline' | 'summary' | 'both';
  errorAnimation: boolean;
  hapticFeedback: boolean;
}

// Offline and Sync Types
export interface OfflineData {
  id: string;
  type: 'contact' | 'deal' | 'task' | 'email' | 'note';
  data: any;
  action: 'create' | 'update' | 'delete';
  timestamp: Date;
  synced: boolean;
  retryCount: number;
  errors?: string[];
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date;
  pendingChanges: number;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  type: 'network' | 'server' | 'conflict' | 'validation';
  message: string;
  data: any;
  timestamp: Date;
  resolved: boolean;
}

// Mobile Search and Filter Types
export interface MobileSearchConfig {
  enabled: boolean;
  placeholder: string;
  voice: boolean;
  suggestions: boolean;
  recentSearches: boolean;
  filters: MobileFilter[];
  sorting: MobileSortOption[];
}

export interface MobileFilter {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'date_range' | 'multi_select';
  options?: FilterOption[];
  value?: any;
  visible: boolean;
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface MobileSortOption {
  id: string;
  label: string;
  field: string;
  direction: 'asc' | 'desc';
  default?: boolean;
}

// Mobile Notification Types
export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: NotificationAction;
  persistent: boolean;
  position: 'top' | 'bottom' | 'center';
  duration: number; // 0 for persistent
  timestamp: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary';
}

// Device and Platform Detection
export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  type: 'phone' | 'tablet' | 'desktop';
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  capabilities: {
    touch: boolean;
    camera: boolean;
    location: boolean;
    push: boolean;
    biometric: boolean;
    nfc: boolean;
  };
  browser?: {
    name: string;
    version: string;
    mobile: boolean;
  };
}

export interface ViewportConfig {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  scale: number;
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

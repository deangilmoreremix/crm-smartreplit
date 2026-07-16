export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
  read: boolean;
  enabled: boolean;
}

export type NotificationVariant = 'success' | 'error' | 'info' | 'warning';

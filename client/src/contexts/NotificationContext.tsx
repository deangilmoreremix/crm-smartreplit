import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Notification, NotificationType } from '../types/notifications';

const STORAGE_KEY = 'smartcrm-notifications';

const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
};

const saveNotifications = (notifications: Notification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // ignore storage errors
  }
};

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  notify: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  dismiss: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const persist = useCallback((items: Notification[]) => {
    saveNotifications(items);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const showDesktopNotification = useCallback((notification: Notification) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
        });
      } catch {
        // ignore desktop notification errors
      }
    }
  }, []);

  const notify = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const timestamp = Date.now();
      const duration = notification.duration ?? 5000;

      const newNotification: Notification = {
        ...notification,
        id,
        timestamp,
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50);
        persist(updated);
        return updated;
      });

      showDesktopNotification(newNotification);

      if (notification.enabled !== false && duration > 0) {
        const timeout = setTimeout(() => {
          setNotifications((prev) => {
            const updated = prev.filter((n) => n.id !== id);
            persist(updated);
            return updated;
          });
          timeoutRefs.current.delete(id);
        }, duration);
        timeoutRefs.current.set(id, timeout);
      }
    },
    [persist, showDesktopNotification]
  );

  const dismiss = useCallback(
    (id: string) => {
      const timeout = timeoutRefs.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(id);
      }
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAll = useCallback(() => {
    timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRefs.current.clear();
    setNotifications([]);
    persist([]);
  }, [persist]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        notify,
        dismiss,
        markAsRead,
        markAllRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

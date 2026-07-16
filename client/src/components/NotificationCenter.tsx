import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification } from '../types/notifications';
import { cn } from '../lib/utils';

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={16} className="text-green-500 shrink-0" />;
    case 'error':
      return <XCircle size={16} className="text-red-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
    case 'info':
    default:
      return <Info size={16} className="text-blue-500 shrink-0" />;
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
};

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isDark } = useTheme();
  const { notifications, unreadCount, dismiss, markAsRead, markAllRead, clearAll } = useNotifications();

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
      setAnchor({ top: rect.bottom + 8, left: rect.left, width: rect.width });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        data-testid="button-notifications"
        className={cn(
          'relative p-2 rounded-full transition-all duration-300',
          isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
        )}
        title="Notifications"
      >
        <Bell
          size={16}
          className={cn('block overflow-visible shrink-0', isDark ? 'text-white' : 'text-gray-600')}
        />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg',
              'bg-red-500 animate-pulse'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen &&
        anchor &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              'fixed z-[9999] min-w-[360px] max-w-[420px] rounded-2xl shadow-2xl',
              'backdrop-blur-2xl border',
              isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-gray-200'
            )}
            style={{
              top: anchor.top,
              left: Math.max(8, anchor.left - 140),
            }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200/30">
              <h3 className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                Notifications
              </h3>
              <div className="flex items-center space-x-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllRead}
                      data-testid="button-mark-all-read"
                      className={cn(
                        'p-1.5 rounded-md text-xs font-medium transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      )}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                    <button
                      onClick={clearAll}
                      data-testid="button-clear-all"
                      className={cn(
                        'p-1.5 rounded-md text-xs font-medium transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                      )}
                      title="Clear all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-notifications"
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  )}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell
                    size={32}
                    className={cn('mx-auto mb-3 opacity-40', isDark ? 'text-gray-400' : 'text-gray-400')}
                  />
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-${notification.id}`}
                    className={cn(
                      'flex items-start space-x-3 p-3 cursor-pointer transition-colors border-b border-gray-200/20 last:border-b-0',
                      notification.read
                        ? isDark
                          ? 'hover:bg-white/5'
                          : 'hover:bg-gray-50'
                        : isDark
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-blue-50/50 hover:bg-blue-50'
                    )}
                  >
                    <div className="mt-0.5">{typeIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isDark ? 'text-white' : 'text-gray-900',
                          !notification.read && 'font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-0.5 line-clamp-2',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {notification.message}
                      </p>
                      <span
                        className={cn(
                          'text-xs mt-1 block',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )}
                      >
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(notification.id);
                      }}
                      data-testid={`button-dismiss-${notification.id}`}
                      className={cn(
                        'p-1 rounded-md shrink-0 transition-colors',
                        isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                      )}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200/30">
                <button
                  onClick={clearAll}
                  data-testid="button-clear-all-footer"
                  className={cn(
                    'w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors',
                    isDark
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-red-600 hover:bg-red-50'
                  )}
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationCenter;

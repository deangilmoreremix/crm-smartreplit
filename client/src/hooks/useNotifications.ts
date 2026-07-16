import { useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationType } from '../types/notifications';

export { useNotifications } from '../contexts/NotificationContext';

export const useNotificationsHelpers = () => {
  const { notify } = useNotifications();

  const success = useCallback(
    (title: string, message: string, duration?: number) => {
      notify({ type: 'success', title, message, duration, enabled: true });
    },
    [notify]
  );

  const error = useCallback(
    (title: string, message: string, duration?: number) => {
      notify({ type: 'error', title, message, duration, enabled: true });
    },
    [notify]
  );

  const info = useCallback(
    (title: string, message: string, duration?: number) => {
      notify({ type: 'info', title, message, duration, enabled: true });
    },
    [notify]
  );

  const warning = useCallback(
    (title: string, message: string, duration?: number) => {
      notify({ type: 'warning', title, message, duration, enabled: true });
    },
    [notify]
  );

  return { success, error, info, warning };
};

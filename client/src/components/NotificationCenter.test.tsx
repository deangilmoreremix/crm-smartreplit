import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationCenter from './NotificationCenter';

vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [
      { id: '1', type: 'info', title: 'Hello', message: 'World', timestamp: Date.now(), read: false, enabled: true },
    ],
    unreadCount: 1,
    dismiss: vi.fn(),
    markAsRead: vi.fn(),
    markAllRead: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

describe('NotificationCenter', () => {
  it('opens the panel without crashing when the bell is clicked', () => {
    render(<NotificationCenter />);
    fireEvent.click(screen.getByTestId('button-notifications'));
    expect(screen.getByLabelText('Notifications panel')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

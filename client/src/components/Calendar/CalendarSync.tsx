import React, { useState } from 'react';
import {
  Calendar,
  RefreshCw,
  Check,
  AlertCircle,
  Link2,
  Unlink,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { ModernButton } from '../ui/ModernButton';
import { useTheme } from '../../contexts/ThemeContext';
import { CalendarProvider, SyncStatus, CalendarSyncState } from '@smartcrm/shared/calendar/types';

interface CalendarSyncProps {
  syncStates?: CalendarSyncState[];
  onConnect?: (provider: CalendarProvider) => void;
  onDisconnect?: (provider: CalendarProvider) => void;
  onSync?: (provider: CalendarProvider) => void;
}

const CalendarSync: React.FC<CalendarSyncProps> = ({
  syncStates = [],
  onConnect,
  onDisconnect,
  onSync,
}) => {
  const { isDark } = useTheme();
  const [isConnecting, setIsConnecting] = useState<CalendarProvider | null>(null);
  const [isSyncing, setIsSyncing] = useState<CalendarProvider | null>(null);

  const getSyncState = (provider: CalendarProvider): CalendarSyncState | undefined => {
    return syncStates.find((s) => s.provider === provider);
  };

  const handleConnect = async (provider: CalendarProvider) => {
    setIsConnecting(provider);
    try {
      await onConnect?.(provider);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSync = async (provider: CalendarProvider) => {
    setIsSyncing(provider);
    try {
      await onSync?.(provider);
    } finally {
      setIsSyncing(null);
    }
  };

  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.CONNECTED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
            <Check size={10} className="mr-1" />
            Connected
          </span>
        );
      case SyncStatus.CONNECTING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <RefreshCw size={10} className="mr-1 animate-spin" />
            Connecting
          </span>
        );
      case SyncStatus.SYNCING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            <RefreshCw size={10} className="mr-1 animate-spin" />
            Syncing
          </span>
        );
      case SyncStatus.ERROR:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
            <AlertCircle size={10} className="mr-1" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
            Disconnected
          </span>
        );
    }
  };

  const googleState = getSyncState(CalendarProvider.GOOGLE);
  const outlookState = getSyncState(CalendarProvider.OUTLOOK);

  return (
    <GlassCard>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Calendar Sync</h2>
          </div>
          <ModernButton variant="ghost" size="sm">
            <Settings size={16} />
          </ModernButton>
        </div>
        <p className="text-sm text-gray-500 mt-1">Connect your calendars to sync appointments</p>
      </div>

      <div className="p-4 space-y-4">
        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-xs text-gray-500">Sync with Google Calendar</p>
              </div>
            </div>
            {googleState && getStatusBadge(googleState.status)}
          </div>

          {googleState?.status === SyncStatus.CONNECTED ? (
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check size={14} className="mr-1 text-green-500" />
                <span>
                  Last synced:{' '}
                  {googleState.lastSyncedAt
                    ? new Date(googleState.lastSyncedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              {googleState.eventCount !== undefined && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {googleState.eventCount} events synced
                </div>
              )}
              <div className="flex space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(CalendarProvider.GOOGLE)}
                  disabled={isSyncing === CalendarProvider.GOOGLE}
                >
                  <RefreshCw
                    size={14}
                    className={isSyncing === CalendarProvider.GOOGLE ? 'animate-spin mr-1' : 'mr-1'}
                  />
                  Sync Now
                </ModernButton>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect?.(CalendarProvider.GOOGLE)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink size={14} className="mr-1" />
                  Disconnect
                </ModernButton>
              </div>
            </div>
          ) : (
            <ModernButton
              variant="primary"
              size="sm"
              onClick={() => handleConnect(CalendarProvider.GOOGLE)}
              disabled={isConnecting === CalendarProvider.GOOGLE}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting === CalendarProvider.GOOGLE ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 size={14} className="mr-1" />
                  Connect Google
                </>
              )}
            </ModernButton>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path fill="#0078D4" d="M1 1l7.93 5.26L23 2v9.76L1 21V1z" />
              </svg>
              <div>
                <h3 className="font-medium">Outlook Calendar</h3>
                <p className="text-xs text-gray-500">Sync with Microsoft Outlook</p>
              </div>
            </div>
            {outlookState && getStatusBadge(outlookState.status)}
          </div>

          {outlookState?.status === SyncStatus.CONNECTED ? (
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check size={14} className="mr-1 text-green-500" />
                <span>
                  Last synced:{' '}
                  {outlookState.lastSyncedAt
                    ? new Date(outlookState.lastSyncedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              {outlookState.eventCount !== undefined && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {outlookState.eventCount} events synced
                </div>
              )}
              <div className="flex space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(CalendarProvider.OUTLOOK)}
                  disabled={isSyncing === CalendarProvider.OUTLOOK}
                >
                  <RefreshCw
                    size={14}
                    className={
                      isSyncing === CalendarProvider.OUTLOOK ? 'animate-spin mr-1' : 'mr-1'
                    }
                  />
                  Sync Now
                </ModernButton>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect?.(CalendarProvider.OUTLOOK)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink size={14} className="mr-1" />
                  Disconnect
                </ModernButton>
              </div>
            </div>
          ) : (
            <ModernButton
              variant="primary"
              size="sm"
              onClick={() => handleConnect(CalendarProvider.OUTLOOK)}
              disabled={isConnecting === CalendarProvider.OUTLOOK}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting === CalendarProvider.OUTLOOK ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 size={14} className="mr-1" />
                  Connect Outlook
                </>
              )}
            </ModernButton>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Calendar size={20} className="text-gray-500 mr-3" />
              <div>
                <h3 className="font-medium">Manual Calendar</h3>
                <p className="text-xs text-gray-500">Add events manually</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
              <Check size={10} className="mr-1" />
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Events added directly in SmartCRM are always available
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ModernButton variant="ghost" size="sm" className="w-full">
          <ChevronRight size={14} className="mr-1" />
          Advanced Settings
        </ModernButton>
      </div>
    </GlassCard>
  );
};

export default CalendarSync;

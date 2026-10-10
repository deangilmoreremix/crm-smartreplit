import React, { useState } from 'react';
import {
  Mail,
  RefreshCw,
  Check,
  AlertCircle,
  Link2,
  Unlink,
  Settings,
  ChevronRight,
  Inbox,
  Send,
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { ModernButton } from '../ui/ModernButton';
import { useTheme } from '../../contexts/ThemeContext';
import { EmailProvider, EmailSyncStatus, EmailAccount } from '@smartcrm/shared/email/types';

interface EmailSyncProps {
  accounts?: EmailAccount[];
  onConnect?: (provider: EmailProvider) => void;
  onDisconnect?: (accountId: string) => void;
  onSync?: (accountId: string) => void;
  onSyncAll?: () => void;
}

const EmailSync: React.FC<EmailSyncProps> = ({
  accounts = [],
  onConnect,
  onDisconnect,
  onSync,
  onSyncAll,
}) => {
  const { isDark } = useTheme();
  const [isConnecting, setIsConnecting] = useState<EmailProvider | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const getStatusBadge = (status: EmailSyncStatus) => {
    switch (status) {
      case EmailSyncStatus.CONNECTED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
            <Check size={10} className="mr-1" />
            Connected
          </span>
        );
      case EmailSyncStatus.CONNECTING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <RefreshCw size={10} className="mr-1 animate-spin" />
            Connecting
          </span>
        );
      case EmailSyncStatus.SYNCING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            <RefreshCw size={10} className="mr-1 animate-spin" />
            Syncing
          </span>
        );
      case EmailSyncStatus.ERROR:
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

  const handleConnect = async (provider: EmailProvider) => {
    setIsConnecting(provider);
    try {
      await onConnect?.(provider);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSync = async (accountId: string) => {
    setIsSyncing(accountId);
    try {
      await onSync?.(accountId);
    } finally {
      setIsSyncing(null);
    }
  };

  const gmailAccount = accounts.find((a) => a.provider === EmailProvider.GMAIL);
  const outlookAccount = accounts.find((a) => a.provider === EmailProvider.OUTLOOK);

  const connectedAccountsCount = accounts.filter(
    (a) => a.syncStatus === EmailSyncStatus.CONNECTED
  ).length;

  return (
    <GlassCard>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Email Sync</h2>
          </div>
          {connectedAccountsCount > 0 && (
            <ModernButton variant="ghost" size="sm" onClick={onSyncAll} className="text-blue-600">
              <RefreshCw size={14} className="mr-1" />
              Sync All
            </ModernButton>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Connect your email accounts for unified inbox</p>
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
                <path fill="#EA4335" d="M1 1l7.93 5.26L23 2v9.76L1 21V1z" />
              </svg>
              <div>
                <h3 className="font-medium">Gmail</h3>
                <p className="text-xs text-gray-500">Connect Gmail account</p>
              </div>
            </div>
            {gmailAccount && getStatusBadge(gmailAccount.syncStatus)}
          </div>

          {gmailAccount?.syncStatus === EmailSyncStatus.CONNECTED ? (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">{gmailAccount.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Inbox size={14} className="mr-1" />
                <span>
                  {gmailAccount.unreadCount || 0} unread / {gmailAccount.totalEmails || 0} total
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check size={14} className="mr-1 text-green-500" />
                <span>
                  Last synced:{' '}
                  {gmailAccount.lastSyncedAt
                    ? new Date(gmailAccount.lastSyncedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(gmailAccount.id)}
                  disabled={isSyncing === gmailAccount.id}
                >
                  <RefreshCw
                    size={14}
                    className={isSyncing === gmailAccount.id ? 'animate-spin mr-1' : 'mr-1'}
                  />
                  Sync
                </ModernButton>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect?.(gmailAccount.id)}
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
              onClick={() => handleConnect(EmailProvider.GMAIL)}
              disabled={isConnecting === EmailProvider.GMAIL}
              className="bg-red-600 hover:bg-red-700"
            >
              {isConnecting === EmailProvider.GMAIL ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 size={14} className="mr-1" />
                  Connect Gmail
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
                <h3 className="font-medium">Outlook</h3>
                <p className="text-xs text-gray-500">Connect Outlook/Hotmail</p>
              </div>
            </div>
            {outlookAccount && getStatusBadge(outlookAccount.syncStatus)}
          </div>

          {outlookAccount?.syncStatus === EmailSyncStatus.CONNECTED ? (
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">{outlookAccount.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Inbox size={14} className="mr-1" />
                <span>
                  {outlookAccount.unreadCount || 0} unread / {outlookAccount.totalEmails || 0} total
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check size={14} className="mr-1 text-green-500" />
                <span>
                  Last synced:{' '}
                  {outlookAccount.lastSyncedAt
                    ? new Date(outlookAccount.lastSyncedAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex space-x-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(outlookAccount.id)}
                  disabled={isSyncing === outlookAccount.id}
                >
                  <RefreshCw
                    size={14}
                    className={isSyncing === outlookAccount.id ? 'animate-spin mr-1' : 'mr-1'}
                  />
                  Sync
                </ModernButton>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect?.(outlookAccount.id)}
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
              onClick={() => handleConnect(EmailProvider.OUTLOOK)}
              disabled={isConnecting === EmailProvider.OUTLOOK}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting === EmailProvider.OUTLOOK ? (
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
              <Mail size={20} className="text-gray-500 mr-3" />
              <div>
                <h3 className="font-medium">SmartCRM Mail</h3>
                <p className="text-xs text-gray-500">Built-in email system</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
              <Check size={10} className="mr-1" />
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Emails sent through SmartCRM are always available
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

export default EmailSync;

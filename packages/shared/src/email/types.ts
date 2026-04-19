export enum EmailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  MANUAL = 'manual',
}

export enum EmailSyncStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SYNCING = 'syncing',
  ERROR = 'error',
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: EmailProvider;
  displayName?: string;
  syncStatus: EmailSyncStatus;
  lastSyncedAt?: Date;
  unreadCount?: number;
  totalEmails?: number;
  isPrimary?: boolean;
}

export interface EmailMessage {
  id: string;
  externalId?: string;
  threadId?: string;
  accountId: string;
  from: {
    name?: string;
    email: string;
  };
  to: Array<{
    name?: string;
    email: string;
  }>;
  subject: string;
  snippet?: string;
  body?: string;
  bodyHtml?: string;
  timestamp: Date;
  isRead: boolean;
  isStarred?: boolean;
  labels?: string[];
  attachments?: EmailAttachment[];
  hasAttachments?: boolean;
  provider: EmailProvider;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
}

export interface EmailSyncConfig {
  provider: EmailProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId?: string;
  syncInterval?: number;
  labels?: string[];
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'custom';
  unreadCount?: number;
  totalCount?: number;
}

export interface EmailFilters {
  folder?: string;
  provider?: EmailProvider;
  searchQuery?: string;
  isRead?: boolean;
  hasAttachment?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  labels?: string[];
}

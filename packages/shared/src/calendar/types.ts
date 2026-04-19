export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  MANUAL = 'manual',
}

export enum SyncStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SYNCING = 'syncing',
  ERROR = 'error',
}

export interface CalendarConfig {
  provider: CalendarProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  calendarId?: string;
  isPrimary?: boolean;
}

export interface CalendarEvent {
  id: string;
  externalId?: string;
  provider: CalendarProvider;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  meetingLink?: string;
  isAllDay?: boolean;
  lastSyncedAt?: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface CalendarSyncState {
  provider: CalendarProvider;
  status: SyncStatus;
  lastSyncedAt?: Date;
  error?: string;
  eventCount?: number;
}

export interface CalendarEventFilters {
  provider?: CalendarProvider;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

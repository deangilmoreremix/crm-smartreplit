/**
 * Client-side White-Label Settings Sync Service
 * Provides debounced propagation, conflict resolution, offline queueing,
 * and real-time event streaming for white-label configuration synchronization.
 */

type SyncStrategy = 'overwrite' | 'merge' | 'prefer-new';
type ConflictStrategy = 'source-wins' | 'target-wins' | 'merge';

export interface WhiteLabelConfig {
  tenantId: string;
  companyName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaButtons?: any[];
  redirectMappings?: Record<string, string>;
  showPricing?: boolean;
  showTestimonials?: boolean;
  showFeatures?: boolean;
  supportEmail?: string;
  supportPhone?: string | null;
  [key: string]: any;
}

export interface PropagationResult {
  sourceTenantId: string;
  targetTenantIds: string[];
  strategy: SyncStrategy;
  results: Array<{ tenantId: string; status: string; error?: string }>;
  summary: { total: number; succeeded: number; failed: number };
}

export interface SyncResult {
  sourceTenantId: string;
  targetTenantId: string;
  strategy: ConflictStrategy;
  syncedConfig: WhiteLabelConfig;
}

export interface HistoryEntry {
  id: string;
  tenantId: string;
  action: 'propagate' | 'sync' | 'backup' | 'restore' | 'update';
  sourceTenantId?: string;
  changes: WhiteLabelConfig;
  changedBy?: string | null;
  changedAt: string;
  metadata?: Record<string, any>;
}

export interface BackupRecord {
  id: string;
  tenantId: string;
  filename: string;
  createdAt: string;
  size?: number;
  label?: string | null;
}

export interface StreamEvent {
  type: 'connected' | 'change' | 'heartbeat' | 'error';
  tenantId?: string;
  timestamp?: string;
  payload?: HistoryEntry;
  message?: string;
}

function getApiBase(): string {
  if (typeof window !== 'undefined' && (window as any).__SMARTCRM_API_BASE__) {
    return (window as any).__SMARTCRM_API_BASE__;
  }
  return '/api/whitelabel';
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBase();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.error || errorBody.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface SettingsSyncOptions {
  debounceMs?: number;
  onSyncComplete?: (result: PropagationResult | SyncResult) => void;
  onError?: (error: Error) => void;
  onStreamEvent?: (event: StreamEvent) => void;
}

export class SettingsSyncService {
  private debounceMs: number;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineQueue: Array<{ endpoint: string; body: any; options: RequestInit }> = [];
  private eventSource: EventSource | null = null;
  private onSyncComplete?: (result: PropagationResult | SyncResult) => void;
  private onError?: (error: Error) => void;
  private onStreamEvent?: (event: StreamEvent) => void;
  private isOnline: boolean = true;

  constructor(options: SettingsSyncOptions = {}) {
    this.debounceMs = options.debounceMs ?? 300;
    this.onSyncComplete = options.onSyncComplete;
    this.onError = options.onError;
    this.onStreamEvent = options.onStreamEvent;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Propagate settings from a source tenant to child/child tenants.
   */
  async propagate(
    sourceTenantId: string,
    targetTenantIds?: string[],
    strategy: SyncStrategy = 'merge'
  ): Promise<PropagationResult> {
    return request<PropagationResult>('/propagate', {
      method: 'POST',
      body: JSON.stringify({ tenantId: sourceTenantId, targetTenantIds, strategy }),
    });
  }

  /**
   * Debounced propagate - waits for debounceMs of inactivity before firing.
   */
  debouncedPropagate(
    sourceTenantId: string,
    targetTenantIds?: string[],
    strategy: SyncStrategy = 'merge'
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.propagate(sourceTenantId, targetTenantIds, strategy).then(
        (result) => this.onSyncComplete?.(result),
        (error) => this.onError?.(error)
      );
    }, this.debounceMs);
  }

  /**
   * Cancel pending debounced propagation.
   */
  cancelDebouncedPropagate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Sync settings between two tenants with conflict resolution.
   */
  async sync(
    sourceTenantId: string,
    targetTenantId: string,
    strategy: ConflictStrategy = 'merge'
  ): Promise<SyncResult> {
    return request<SyncResult>('/sync', {
      method: 'POST',
      body: JSON.stringify({ sourceTenantId, targetTenantId, strategy }),
    });
  }

  /**
   * Fetch propagation/sync history for a tenant.
   */
  async getHistory(tenantId: string, limit = 50): Promise<HistoryEntry[]> {
    return request<{ history: HistoryEntry[] }>(`/history/${encodeURIComponent(tenantId)}?limit=${limit}`).then(
      (res) => res.history
    );
  }

  /**
   * Create a filesystem backup of a tenant's white-label config.
   */
  async createBackup(tenantId: string, label?: string): Promise<{ backup: BackupRecord }> {
    return request<{ backup: BackupRecord }>('/backup', {
      method: 'POST',
      body: JSON.stringify({ tenantId, label }),
    });
  }

  /**
   * Restore a tenant's white-label config from a backup file.
   */
  async restore(tenantId: string, filename: string): Promise<{ restoredConfig: WhiteLabelConfig }> {
    return request<{ restoredConfig: WhiteLabelConfig }>('/restore', {
      method: 'POST',
      body: JSON.stringify({ tenantId, filename }),
    });
  }

  /**
   * List available backups for a tenant.
   */
  async listBackups(tenantId: string): Promise<BackupRecord[]> {
    return request<{ backups: BackupRecord[] }>(`/backups/${encodeURIComponent(tenantId)}`).then(
      (res) => res.backups
    );
  }

  /**
   * Open an SSE stream for real-time white-label config change events.
   */
  stream(tenantId: string, pollIntervalMs = 5000): void {
    if (typeof window === 'undefined') return;
    if (this.eventSource) {
      this.eventSource.close();
    }

    const base = getApiBase();
    const url = `${base}/stream/${encodeURIComponent(tenantId)}?interval=${pollIntervalMs}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('connected', (event: MessageEvent) => {
      this.onStreamEvent?.({ type: 'connected', ...JSON.parse(event.data) });
    });

    this.eventSource.addEventListener('change', (event: MessageEvent) => {
      this.onStreamEvent?.({ type: 'change', ...JSON.parse(event.data) });
    });

    this.eventSource.addEventListener('heartbeat', (event: MessageEvent) => {
      this.onStreamEvent?.({ type: 'heartbeat', ...JSON.parse(event.data) });
    });

    this.eventSource.addEventListener('error', (event: MessageEvent) => {
      this.onStreamEvent?.({ type: 'error', ...JSON.parse(event.data) });
    });

    this.eventSource.onerror = () => {
      this.onStreamEvent?.({ type: 'error', message: 'SSE connection error' });
    };
  }

  /**
   * Close the active SSE stream.
   */
  closeStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      const item = this.offlineQueue.shift();
      if (!item) continue;
      try {
        await request(item.endpoint, item.options);
      } catch (error) {
        this.offlineQueue.unshift(item);
        throw error;
      }
    }
  }

  /**
   * Enqueue a request for retry when connectivity is restored.
   */
  private enqueueOffline(endpoint: string, body: any, options: RequestInit): void {
    this.offlineQueue.push({ endpoint, body, options });
  }
}

export const settingsSync = new SettingsSyncService();

export default settingsSync;

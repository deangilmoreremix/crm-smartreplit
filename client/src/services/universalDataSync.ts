
import { remoteAppManager } from '../utils/remoteAppManager';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';
import { useTaskStore } from '../store/taskStore';

export interface UniversalSyncData {
  contacts: any[];
  deals: any[];
  tasks: any[];
  activities: any[];
  analytics: any;
  timestamp: number;
  version: string;
}

export class UniversalDataSyncService {
  private static instance: UniversalDataSyncService;
  private syncInterval: number | null = null;
  private lastSyncTimestamp: number = 0;
  private isDirty: Set<string> = new Set();
  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;

  static getInstance(): UniversalDataSyncService {
    if (!UniversalDataSyncService.instance) {
      UniversalDataSyncService.instance = new UniversalDataSyncService();
    }
    return UniversalDataSyncService.instance;
  }

  // Initialize the sync service
  initialize() {
    if (this.isInitialized) {
      console.warn('Universal Data Sync Service already initialized');
      return;
    }

    if (this.isDestroyed) {
      console.error('Cannot initialize destroyed Universal Data Sync Service');
      return;
    }

    try {
      console.log('🔄 Initializing Universal Data Sync Service');

      // Start periodic sync
      this.startPeriodicSync();

      // Listen for data changes from stores
      this.setupStoreListeners();

      // Listen for remote app events
      this.setupRemoteAppListeners();

      this.isInitialized = true;
      console.log('✅ Universal Data Sync Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Universal Data Sync Service:', error);
      this.destroy();
      throw error;
    }
  }

  private setupStoreListeners() {
    // Listen for contact changes
    window.addEventListener('contactsChanged', (event: any) => {
      this.markDirty('contacts');
      remoteAppManager.syncContactsToAllApps(event.detail.contacts);
    });

    // Listen for deal changes
    window.addEventListener('dealsChanged', (event: any) => {
      this.markDirty('deals');
      remoteAppManager.syncDealsToAllApps(event.detail.deals);
    });

    // Listen for task changes
    window.addEventListener('tasksChanged', (event: any) => {
      this.markDirty('tasks');
      remoteAppManager.syncTasksToAllApps(event.detail.tasks);
    });
  }

  private setupRemoteAppListeners() {
    // Listen for incoming data from remote apps
    remoteAppManager.onCrossAppEvent('CONTACT_CREATED', (data: any, sourceApp: string) => {
      console.log(`📝 Contact created in ${sourceApp}:`, data);
      this.handleIncomingContactData('create', data);
    });

    remoteAppManager.onCrossAppEvent('CONTACT_UPDATED', (data: any, sourceApp: string) => {
      console.log(`✏️ Contact updated in ${sourceApp}:`, data);
      this.handleIncomingContactData('update', data);
    });

    remoteAppManager.onCrossAppEvent('DEAL_CREATED', (data: any, sourceApp: string) => {
      console.log(`💰 Deal created in ${sourceApp}:`, data);
      this.handleIncomingDealData('create', data);
    });

    remoteAppManager.onCrossAppEvent('DEAL_UPDATED', (data: any, sourceApp: string) => {
      console.log(`💼 Deal updated in ${sourceApp}:`, data);
      this.handleIncomingDealData('update', data);
    });

    remoteAppManager.onCrossAppEvent('TASK_CREATED', (data: any, sourceApp: string) => {
      console.log(`📋 Task created in ${sourceApp}:`, data);
      this.handleIncomingTaskData('create', data);
    });
  }

  private handleIncomingContactData(action: string, data: any) {
    const contactStore = useContactStore.getState();
    
    switch (action) {
      case 'create':
        contactStore.addContact(data);
        break;
      case 'update':
        contactStore.updateContact(data.id, data);
        break;
      case 'delete':
        contactStore.deleteContact(data.id);
        break;
    }
  }

  private handleIncomingDealData(action: string, data: any) {
    const dealStore = useDealStore.getState();
    
    switch (action) {
      case 'create':
        dealStore.addDeal(data);
        break;
      case 'update':
        dealStore.updateDeal(data.id, data);
        break;
      case 'delete':
        dealStore.deleteDeal(data.id);
        break;
    }
  }

  private handleIncomingTaskData(action: string, data: any) {
    const taskStore = useTaskStore.getState();
    
    switch (action) {
      case 'create':
        taskStore.addTask(data);
        break;
      case 'update':
        taskStore.updateTask(data.id, data);
        break;
      case 'delete':
        taskStore.deleteTask(data.id);
        break;
    }
  }

  // Get current synchronized data
  getCurrentSyncData(): UniversalSyncData {
    const contactStore = useContactStore.getState();
    const dealStore = useDealStore.getState();
    const taskStore = useTaskStore.getState();

    return {
      contacts: Object.values(contactStore.contacts),
      deals: Object.values(dealStore.deals),
      tasks: Object.values(taskStore.tasks),
      activities: [], // Would come from activity store
      analytics: {
        totalContacts: Object.keys(contactStore.contacts).length,
        totalDeals: Object.keys(dealStore.deals).length,
        totalTasks: Object.keys(taskStore.tasks).length
      },
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  // Sync all data to remote apps
  syncAllData() {
    const syncData = this.getCurrentSyncData();
    
    // Sync to each data type
    remoteAppManager.syncContactsToAllApps(syncData.contacts);
    remoteAppManager.syncDealsToAllApps(syncData.deals);
    remoteAppManager.syncTasksToAllApps(syncData.tasks);
    
    // Broadcast full sync event
    remoteAppManager.broadcastToAllApps('FULL_DATA_SYNC', syncData, 'crm');
    
    this.lastSyncTimestamp = Date.now();
    this.isDirty.clear();
    
    console.log('✅ Full data sync completed');
  }

  private markDirty(dataType: string) {
    this.isDirty.add(dataType);
  }

  private startPeriodicSync() {
    // Sync every 30 seconds if there are changes
    this.syncInterval = window.setInterval(() => {
      if (this.isDirty.size > 0) {
        console.log('🔄 Periodic sync triggered for:', Array.from(this.isDirty));
        this.syncAllData();
      }
    }, 30000);
  }

  // Manual sync trigger
  forceSyncAll() {
    console.log('🔄 Force syncing all data');
    this.syncAllData();
  }

  // Destroy the service
  destroy() {
    if (this.isDestroyed) {
      console.warn('Universal Data Sync Service already destroyed');
      return;
    }

    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Clear state
      this.isDirty.clear();
      this.isInitialized = false;
      this.isDestroyed = true;

      console.log('🔌 Universal Data Sync Service destroyed');
    } catch (error) {
      console.error('❌ Error during Universal Data Sync Service destruction:', error);
    }
  }
}

export const universalDataSync = UniversalDataSyncService.getInstance();

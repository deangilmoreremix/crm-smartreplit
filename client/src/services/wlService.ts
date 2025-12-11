import type { 
  UserWLSettings, 
  InsertUserWLSettings, 
  TenantConfig, 
  InsertTenantConfig,
  PartnerWLConfig,
  InsertPartnerWLConfig
} from '@shared/schema';

const API_BASE = '/api';

export class WLService {
  // User White Label Settings
  static async getUserWLSettings(userId: string): Promise<UserWLSettings | null> {
    try {
      const response = await fetch(`${API_BASE}/user/wl-settings/${userId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user WL settings:', error);
      return null;
    }
  }

  static async createUserWLSettings(data: InsertUserWLSettings): Promise<UserWLSettings> {
    const response = await fetch(`${API_BASE}/user/wl-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create user WL settings: ${response.statusText}`);
    return await response.json();
  }

  static async updateUserWLSettings(userId: string, data: Partial<UserWLSettings>): Promise<UserWLSettings> {
    const response = await fetch(`${API_BASE}/user/wl-settings/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update user WL settings: ${response.statusText}`);
    return await response.json();
  }

  // Tenant Configuration
  static async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    try {
      const response = await fetch(`${API_BASE}/tenant/config/${tenantId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch tenant config:', error);
      return null;
    }
  }

  static async createTenantConfig(data: InsertTenantConfig): Promise<TenantConfig> {
    const response = await fetch(`${API_BASE}/tenant/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create tenant config: ${response.statusText}`);
    return await response.json();
  }

  static async updateTenantConfig(tenantId: string, data: Partial<TenantConfig>): Promise<TenantConfig> {
    const response = await fetch(`${API_BASE}/tenant/config/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update tenant config: ${response.statusText}`);
    return await response.json();
  }

  // Partner White Label Configuration
  static async getPartnerWLConfig(partnerId: string): Promise<PartnerWLConfig | null> {
    try {
      const response = await fetch(`${API_BASE}/partner/wl-config/${partnerId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch partner WL config:', error);
      return null;
    }
  }

  static async createPartnerWLConfig(data: InsertPartnerWLConfig): Promise<PartnerWLConfig> {
    const response = await fetch(`${API_BASE}/partner/wl-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create partner WL config: ${response.statusText}`);
    return await response.json();
  }

  static async updatePartnerWLConfig(partnerId: string, data: Partial<PartnerWLConfig>): Promise<PartnerWLConfig> {
    const response = await fetch(`${API_BASE}/partner/wl-config/${partnerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update partner WL config: ${response.statusText}`);
    return await response.json();
  }

  // Utility methods for local storage and synchronization
  static saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`wl_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`wl_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  }

  static removeFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`wl_${key}`);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  // Batch operations for better performance
  static async syncUserData(userId: string, localData: Partial<UserWLSettings>): Promise<UserWLSettings> {
    // Check if user settings exist in database
    const existingSettings = await this.getUserWLSettings(userId);
    
    if (existingSettings) {
      // Update existing settings
      return await this.updateUserWLSettings(userId, localData);
    } else {
      // Create new settings
      return await this.createUserWLSettings({
        userId,
        ...localData
      } as InsertUserWLSettings);
    }
  }

  static async syncTenantData(tenantId: string, localData: Partial<TenantConfig>): Promise<TenantConfig> {
    // Check if tenant config exists in database
    const existingConfig = await this.getTenantConfig(tenantId);
    
    if (existingConfig) {
      // Update existing config
      return await this.updateTenantConfig(tenantId, localData);
    } else {
      // Create new config
      return await this.createTenantConfig({
        tenantId,
        ...localData
      } as InsertTenantConfig);
    }
  }
}

export default WLService;
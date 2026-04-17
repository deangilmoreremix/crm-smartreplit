import { UserAPIKey, ProviderConfig } from '../types';

export class KeyManager {
  private static readonly STORAGE_KEY = 'smartcrm_api_keys';
  private static readonly ENCRYPTION_KEY = 'smartcrm_encryption_key'; // In production, this should be derived from user password

  static encrypt(text: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    const key = this.ENCRYPTION_KEY;
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  static decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      const key = this.ENCRYPTION_KEY;
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  }

  static getKeys(): UserAPIKey[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((key: any) => ({
        ...key,
        createdAt: new Date(key.createdAt),
        lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
        apiKey: this.decrypt(key.apiKey),
      }));
    } catch {
      return [];
    }
  }

  static setKey(providerId: string, apiKey: string): void {
    const keys = this.getKeys();
    const existingIndex = keys.findIndex((k) => k.providerId === providerId);

    const encryptedKey = this.encrypt(apiKey);
    const keyData: UserAPIKey = {
      providerId,
      apiKey: encryptedKey,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    if (existingIndex >= 0) {
      keys[existingIndex] = keyData;
    } else {
      keys.push(keyData);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  static removeKey(providerId: string): void {
    const keys = this.getKeys().filter((k) => k.providerId !== providerId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  static getKey(providerId: string): string | null {
    const keys = this.getKeys();
    const key = keys.find((k) => k.providerId === providerId && k.isActive);
    if (!key) return null;

    // Update last used
    key.lastUsedAt = new Date();
    const allKeys = keys.map((k) => ({
      ...k,
      lastUsedAt: k.lastUsedAt?.toISOString(),
    }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allKeys));

    return key.apiKey;
  }

  static hasKey(providerId: string): boolean {
    return this.getKey(providerId) !== null;
  }

  static getProviderConfig(providerId: string): ProviderConfig {
    const apiKey = this.getKey(providerId);
    return {
      apiKey: apiKey || undefined,
      timeout: 30000,
      retries: 3,
    };
  }
}

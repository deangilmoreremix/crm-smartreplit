export const cacheService = {
  get<T>(namespace: string, key: string): T | null {
    try {
      const item = localStorage.getItem(`${namespace}_${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(`${namespace}_${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  },

  set<T>(namespace: string, key: string, data: T, ttl?: number, tags?: string[]): void {
    try {
      const item = {
        data,
        expiry: ttl ? Date.now() + ttl : null,
        tags: tags || []
      };
      localStorage.setItem(`${namespace}_${key}`, JSON.stringify(item));
    } catch {
      // Ignore storage errors
    }
  }
};
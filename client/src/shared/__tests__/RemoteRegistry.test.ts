// Tests for RemoteRegistry
import { remoteRegistry, REMOTE_APPS } from '../federation/RemoteRegistry';

describe('RemoteRegistry', () => {
  describe('getApp', () => {
    it('returns app by ID', () => {
      const app = remoteRegistry.getApp('contacts');
      expect(app).toBeDefined();
      expect(app?.id).toBe('contacts');
      expect(app?.name).toBe('Enhanced Contacts Module');
    });

    it('returns undefined for non-existent app', () => {
      const app = remoteRegistry.getApp('nonexistent');
      expect(app).toBeUndefined();
    });
  });

  describe('getAllApps', () => {
    it('returns all 7 registered apps', () => {
      const apps = remoteRegistry.getAllApps();
      expect(apps).toHaveLength(7);
      expect(apps.map(a => a.id)).toEqual([
        'contacts', 'agency', 'analytics', 'pipeline', 
        'research', 'calendar', 'ai-analytics'
      ]);
    });
  });

  describe('getAppsByCapability', () => {
    it('returns apps with analytics capability', () => {
      const apps = remoteRegistry.getAppsByCapability('analytics');
      expect(apps.length).toBeGreaterThan(0);
      expect(apps.find(a => a.id === 'analytics')).toBeDefined();
      expect(apps.find(a => a.id === 'ai-analytics')).toBeDefined();
    });

    it('returns empty array for non-existent capability', () => {
      const apps = remoteRegistry.getAppsByCapability('nonexistent' as any);
      expect(apps).toHaveLength(0);
    });
  });

  describe('hasApp', () => {
    it('returns true for existing app', () => {
      expect(remoteRegistry.hasApp('contacts')).toBe(true);
    });

    it('returns false for non-existing app', () => {
      expect(remoteRegistry.hasApp('nonexistent')).toBe(false);
    });
  });

  describe('hasCapability', () => {
    it('returns true when app has capability', () => {
      expect(remoteRegistry.hasCapability('contacts', 'contacts')).toBe(true);
      expect(remoteRegistry.hasCapability('contacts', 'ai-scoring')).toBe(true);
    });

    it('returns false when app lacks capability', () => {
      expect(remoteRegistry.hasCapability('contacts', 'calendar')).toBe(false);
    });

    it('returns false for non-existent app', () => {
      expect(remoteRegistry.hasCapability('nonexistent', 'contacts')).toBe(false);
    });
  });

  describe('getRemoteEntryUrl', () => {
    it('returns correct remote entry URL', () => {
      const url = remoteRegistry.getRemoteEntryUrl('contacts');
      expect(url).toBe('https://taupe-sprinkles-83c9ee.netlify.app/remoteEntry.js');
    });

    it('throws for non-existent app', () => {
      expect(() => remoteRegistry.getRemoteEntryUrl('nonexistent')).toThrow('App not found');
    });
  });

  describe('getScope', () => {
    it('returns correct scope for app', () => {
      expect(remoteRegistry.getScope('contacts')).toBe('enhanced_contacts');
      expect(remoteRegistry.getScope('analytics')).toBe('ai_analytics');
    });
  });
});
/**
 * Module Federation Loading Tests
 * Run these to verify remote app loading functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadRemoteEntry, getRemoteNames, clearLoadedRemotes } from '../loadRemoteEntry';

// Test all remote entries
export async function testAllRemoteEntries() {
  console.log('🧪 Testing Module Federation Remote Entries...\n');

  const remoteNames = getRemoteNames();
  const results = [];

  for (const remoteName of remoteNames) {
    console.log(`Testing ${remoteName}...`);
    try {
      const success = await loadRemoteEntry(remoteName);
      results.push({ name: remoteName, success });
      console.log(`✅ ${remoteName}: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      results.push({ name: remoteName, success: false, error: error.message });
      console.log(`❌ ${remoteName}: FAILED - ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach((result) => {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${result.name}: ${status}`);
  });

  const workingCount = results.filter((r) => r.success).length;
  console.log(`\nTotal: ${workingCount}/${results.length} remotes working`);

  return results;
}

// Test individual remote with detailed logging
export async function testRemoteEntry(remoteName: string) {
  console.log(`🔍 Detailed test for ${remoteName}`);

  clearLoadedRemotes(); // Clear cache for fresh test

  const startTime = Date.now();
  const success = await loadRemoteEntry(remoteName);
  const endTime = Date.now();

  console.log(`Result: ${success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Time: ${endTime - startTime}ms`);

  return { success, time: endTime - startTime };
}

// Quick health check
export function healthCheck() {
  const remoteNames = getRemoteNames();
  console.log('🏥 Module Federation Health Check');
  console.log('==================================');
  console.log(`Available remotes: ${remoteNames.join(', ')}`);
  console.log(`MFE enabled: ${import.meta.env.VITE_ENABLE_MFE === 'true' ? 'YES' : 'NO'}`);
  console.log(`Environment: ${import.meta.env.DEV ? 'DEVELOPMENT' : 'PRODUCTION'}`);

  return {
    remotes: remoteNames,
    mfeEnabled: import.meta.env.VITE_ENABLE_MFE === 'true',
    isDev: import.meta.env.DEV,
  };
}

// Run tests if this file is executed directly
if (import.meta.hot) {
  // Development mode - expose functions to console
  (window as any).mfeTests = {
    testAll: testAllRemoteEntries,
    testRemote: testRemoteEntry,
    healthCheck,
    clearCache: clearLoadedRemotes,
  };

  console.log('🧪 MFE Test functions available on window.mfeTests:');
  console.log('- window.mfeTests.testAll() - Test all remotes');
  console.log('- window.mfeTests.testRemote("pipeline") - Test specific remote');
  console.log('- window.mfeTests.healthCheck() - Show health status');
  console.log('- window.mfeTests.clearCache() - Clear loaded cache');
}


describe('loadRemoteEntry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('lists the configured remotes', () => {
    expect(getRemoteNames()).toEqual(
      expect.arrayContaining(['pipeline', 'analytics', 'contacts', 'calendar', 'agency', 'research'])
    );
  });

  it('returns false without touching the network when the MFE flag is off', async () => {
    vi.stubEnv('VITE_ENABLE_MFE', 'false');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const mod = await import('../loadRemoteEntry');

    expect(mod.isMFEEnabled()).toBe(false);
    expect(await mod.loadRemoteEntry('pipeline')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false for an unknown remote when enabled', async () => {
    vi.stubEnv('VITE_ENABLE_MFE', 'true');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const mod = await import('../loadRemoteEntry');

    expect(mod.isMFEEnabled()).toBe(true);
    expect(await mod.loadRemoteEntry('does-not-exist')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false and skips retries shortly after a failed load', async () => {
    vi.stubEnv('VITE_ENABLE_MFE', 'true');
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const mod = await import('../loadRemoteEntry');

    expect(await mod.loadRemoteEntry('pipeline')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Recent failure is cached: no second network attempt
    expect(await mod.loadRemoteEntry('pipeline')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Clearing the cache allows a fresh attempt
    mod.clearLoadedRemotes();
    expect(await mod.loadRemoteEntry('pipeline')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

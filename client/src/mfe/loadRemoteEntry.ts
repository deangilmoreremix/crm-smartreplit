/**
 * Safe Module Federation Remote Entry Loader
 *
 * Feature flag: VITE_ENABLE_MFE (default: false)
 *
 * Provides:
 * - Single attempt per remote per session
 * - 4 second timeout
 * - Clear error logging
 * - Returns boolean success
 */

import type { FederationRemote } from './types';

// Feature flag - set to true to enable MFE
const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Timeout in milliseconds
const LOAD_TIMEOUT = 4000;

// Track loaded remotes to avoid repeated attempts
const loadedRemotes = new Map<string, { success: boolean; timestamp: number }>();

/**
 * Remote configuration
 */
export const MFE_REMOTES: Record<string, { url: string; module: string }> = {
  pipeline: {
    url: 'https://cheery-syrniki-b5b6ca.netlify.app',
    module: './PipelineApp',
  },
  analytics: {
    url: 'https://ai-analytics.smartcrm.vip',
    module: './AnalyticsApp',
  },
  contacts: {
    url: 'https://taupe-sprinkles-83c9ee.netlify.app',
    module: './ContactsApp',
  },
  calendar: {
    url: 'https://calendar.smartcrm.vip',
    module: './CalendarApp',
  },
  agency: {
    url: 'https://agency.smartcrm.vip',
    module: './AIAgencyApp',
  },
  research: {
    url: 'https://clever-syrniki-4df87f.netlify.app',
    module: './ProductResearchApp',
  },
};

/**
 * Load a remote module with timeout and error handling
 * @param remoteName - Name of the remote (key in MFE_REMOTES)
 * @returns Promise<boolean> - true if loaded successfully
 */
export async function loadRemoteEntry(remoteName: string): Promise<boolean> {
  // Check feature flag first
  if (!ENABLE_MFE) {
    console.log(`[MFE] Module Federation disabled via VITE_ENABLE_MFE flag`);
    return false;
  }

  const remote = MFE_REMOTES[remoteName];
  if (!remote) {
    console.error(`[MFE] Unknown remote: ${remoteName}`);
    return false;
  }

  // Check if already loaded in this session
  const cached = loadedRemotes.get(remoteName);
  if (cached?.success) {
    console.log(`[MFE] ${remoteName} already loaded successfully`);
    return true;
  }

  // Check if we recently tried and failed (within 30 seconds)
  if (cached && Date.now() - cached.timestamp < 30000) {
    console.log(`[MFE] ${remoteName} recently failed, skipping`);
    return false;
  }

  const remoteUrl = `${remote.url}/assets/remoteEntry.js`;
  console.log(`[MFE] Loading ${remoteName} from ${remoteUrl}...`);

  try {
    // First, try to fetch the remote entry to check if it exists
    const response = await fetch(remoteUrl, {
      method: 'HEAD',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[MFE] Remote entry exists for ${remoteName}, proceeding with import`);

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MFE load timeout')), LOAD_TIMEOUT);
    });

    // Create load promise
    const loadPromise = new Promise<boolean>((resolve, reject) => {
      // Use dynamic import to load the remote entry
      // Note: This requires the remote to be configured in vite.config.ts
      import(/* @vite-ignore */ remoteUrl)
        .then(() => {
          console.log(`[MFE] Successfully loaded ${remoteName}`);
          loadedRemotes.set(remoteName, { success: true, timestamp: Date.now() });
          resolve(true);
        })
        .catch((err) => {
          console.error(`[MFE] Failed to load ${remoteName}:`, err);
          reject(err);
        });
    });

    // Race between load and timeout
    await Promise.race([loadPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error(`[MFE] Error loading ${remoteName}:`, error);
    loadedRemotes.set(remoteName, { success: false, timestamp: Date.now() });
    return false;
  }
}

/**
 * Check if MFE is enabled
 */
export function isMFEEnabled(): boolean {
  return ENABLE_MFE;
}

/**
 * Get all remote names
 */
export function getRemoteNames(): string[] {
  return Object.keys(MFE_REMOTES);
}

/**
 * Clear the loaded remotes cache (useful for testing)
 */
export function clearLoadedRemotes(): void {
  loadedRemotes.clear();
  console.log('[MFE] Cleared loaded remotes cache');
}

export default loadRemoteEntry;

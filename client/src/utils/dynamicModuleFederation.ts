// Dynamic Module Federation Loader - Updated for ES Module remoteEntry.js
// Uses dynamic import() to load ESM-based remoteEntry from Vite Module Federation

export interface RemoteModuleConfig {
  url: string;
  scope: string;
  module: string;
}

interface ModuleContainer {
  init(shared: Record<string, unknown>): Promise<void>;
  get(module: string): Promise<() => unknown>;
}

class DynamicModuleFederation {
  private loadedRemotes = new Map<string, ModuleContainer>();

  async loadRemoteModule<T = unknown>(config: RemoteModuleConfig): Promise<T> {
    const { url, scope, module } = config;

    // Load/reuse the remote entry container
    const container = await this.getOrLoadContainer(url);

    // Initialize container with shared dependencies (idempotent)
    await this.initContainer(container);

    // Get the module factory
    const factory = await container.get(module);
    const Module = factory() as { default?: unknown };

    return (Module.default || Module) as T;
  }

  private async getOrLoadContainer(url: string): Promise<ModuleContainer> {
    // Reuse cached container if available
    if (this.loadedRemotes.has(url)) {
      console.log(`♻️ Using cached Module Federation container: ${url}`);
      return this.loadedRemotes.get(url)!;
    }

    // Try multiple possible remoteEntry.js locations
    const possibleUrls = this.buildPossibleUrls(url);

    for (let i = 0; i < possibleUrls.length; i++) {
      const remoteEntryUrl = possibleUrls[i];
      try {
        console.log(`🔄 Attempting to load Module Federation remoteEntry from: ${remoteEntryUrl}`);
        // Use dynamic import to load ES module
        // @vite-ignore: prevent Vite from trying to analyze the dynamic import
        const namespace = await import(/* @vite-ignore */ remoteEntryUrl);

        // The remoteEntry should export init and get functions
        if (namespace.init && namespace.get) {
          console.log(`✅ Module Federation remoteEntry loaded successfully: ${remoteEntryUrl}`);
          this.loadedRemotes.set(url, namespace as ModuleContainer);
          return namespace as ModuleContainer;
        } else {
          console.warn(`⚠️ RemoteEntry at ${remoteEntryUrl} missing init/get exports`);
          continue;
        }
      } catch (err) {
        console.warn(`❌ Failed to load remoteEntry from ${remoteEntryUrl}:`, err);
        continue;
      }
    }

    const errorMsg = `Failed to load Module Federation remoteEntry from all attempted URLs: ${possibleUrls.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  private buildPossibleUrls(baseUrl: string): string[] {
    const urls = [];

    // If the URL already ends with .js, treat it as direct remoteEntry
    if (baseUrl.endsWith('.js')) {
      urls.push(baseUrl);
    } else {
      // Try common locations
      urls.push(`${baseUrl}/remoteEntry.js`);
      urls.push(`${baseUrl}/assets/remoteEntry.js`);
      urls.push(`${baseUrl}/static/js/remoteEntry.js`);
    }

    return urls;
  }

  private async initContainer(container: ModuleContainer): Promise<void> {
    // Shared dependencies - these will be resolved from host app
    const shared = {
      react: () => import('react'),
      'react-dom': () => import('react-dom'),
      'react-router-dom': () => import('react-router-dom'),
    };

    await container.init(shared);
  }

  // Preload a remote module
  async preloadRemoteModule(config: RemoteModuleConfig): Promise<void> {
    try {
      await this.loadRemoteModule(config);
    } catch (error) {
      console.warn('Failed to preload remote module:', error);
    }
  }

  // Clear cache if needed
  clearCache(): void {
    this.loadedRemotes.clear();
  }
}

export const moduleFederation = new DynamicModuleFederation();

// Utility function for easy loading
export async function loadRemoteComponent<T = unknown>(
  remoteUrl: string,
  scope: string,
  module: string
): Promise<T> {
  return moduleFederation.loadRemoteModule<T>({
    url: remoteUrl,
    scope,
    module,
  });
}

// React hook for loading remote components
import { useState, useEffect } from 'react';

export function useRemoteComponent<T = unknown>(
  remoteUrl: string | null,
  scope: string,
  module: string
) {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!remoteUrl) {
      setComponent(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadComponent = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedComponent = await loadRemoteComponent<T>(remoteUrl, scope, module);

        if (!cancelled) {
          setComponent(loadedComponent);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load remote component'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      cancelled = true;
    };
  }, [remoteUrl, scope, module]);

  return { component, loading, error };
}

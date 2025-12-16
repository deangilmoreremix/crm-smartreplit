// Dynamic Module Federation Loader - Works without Vite config changes
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactRouterDOM from 'react-router-dom';

export interface RemoteModuleConfig {
  url: string;
  scope: string;
  module: string;
}

interface ModuleContainer {
  init(shared: any): Promise<void>;
  get(module: string): Promise<() => any>;
}

declare global {
  interface Window {
    [key: string]: ModuleContainer;
  }
}

class DynamicModuleFederation {
  private loadedScripts = new Set<string>();
  private loadedContainers = new Map<string, ModuleContainer>();

  async loadRemoteModule<T = any>(config: RemoteModuleConfig): Promise<T> {
    const { url, scope, module } = config;
    
    // Load the remote script if not already loaded
    if (!this.loadedScripts.has(url)) {
      await this.loadScript(url);
      this.loadedScripts.add(url);
    }

    // Get the container
    const container = await this.getContainer(scope);
    
    // Initialize container with shared dependencies
    await this.initContainer(container);
    
    // Get the module factory
    const factory = await container.get(module);
    const Module = factory();
    
    return Module.default || Module;
  }

  private async loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try different possible script URLs (root path FIRST for optimal config)
      const possibleUrls = [
        url.endsWith('.js') ? url : `${url}/remoteEntry.js`, // Root path FIRST (e.g., https://ai-analytics.smartcrm.vip/remoteEntry.js)
        `${url}/assets/remoteEntry.js`,
        `${url}/static/js/remoteEntry.js`
      ];
      
      let currentUrlIndex = 0;
      
      const tryNextUrl = async () => {
        if (currentUrlIndex >= possibleUrls.length) {
          const error = new Error(`Failed to load remote script from any of: ${possibleUrls.join(', ')}`);
          console.error('❌ Module Federation script loading failed:', error);
          reject(error);
          return;
        }
        
        const scriptUrl = possibleUrls[currentUrlIndex];
        currentUrlIndex++;
        
        console.log(`🔄 Trying Module Federation script: ${scriptUrl}`);
        
        try {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          
          await new Promise<void>((scriptResolve, scriptReject) => {
            script.onload = () => {
              console.log(`✅ Module Federation script loaded: ${scriptUrl}`);
              scriptResolve();
            };
            
            script.onerror = (error) => {
              console.warn(`❌ Failed to load script from: ${scriptUrl}`, error);
              scriptReject(error);
            };
            
            // Timeout fallback
            const timeout = setTimeout(() => {
              scriptReject(new Error(`Script load timeout: ${scriptUrl}`));
            }, 5000);
            
            script.src = scriptUrl;
            document.head.appendChild(script);
          }).catch(() => {
            // On error, try the next URL
            tryNextUrl();
          });
          
          resolve();
        } catch (error) {
          console.error('Error during script load attempt:', error);
          tryNextUrl();
        }
      };
      
      tryNextUrl();
    });
  }

  private async getContainer(scope: string): Promise<ModuleContainer> {
    if (this.loadedContainers.has(scope)) {
      console.log(`♻️ Using cached Module Federation container: ${scope}`);
      return this.loadedContainers.get(scope)!;
    }

    // Wait for the global to be available (reduced for faster fallback)
    let retries = 0;
    const maxRetries = 20; // 2 seconds max wait
    
    console.log(`🔍 Looking for Module Federation container: ${scope}`);
    
    while (!window[scope] && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
      
      if (retries % 10 === 0) {
        console.log(`⏳ Still waiting for container "${scope}" (${retries}/${maxRetries})`);
      }
    }

    if (!window[scope]) {
      const availableContainers = Object.keys(window).filter(key => 
        typeof window[key] === 'object' && 
        window[key] !== null && 
        typeof (window[key] as any).get === 'function'
      );
      const error = new Error(`Remote container "${scope}" not found. Available containers: ${availableContainers.join(', ') || 'none'}`);
      console.error('❌ Module Federation container not found:', error);
      throw error;
    }

    console.log(`✅ Module Federation container found: ${scope}`);
    const container = window[scope] as ModuleContainer;
    this.loadedContainers.set(scope, container);
    return container;
  }

  private async initContainer(container: ModuleContainer): Promise<void> {
    // Get shared dependencies dynamically
    const shared = {
      react: () => import('react'),
      'react-dom': () => import('react-dom'),
      'react-router-dom': () => import('react-router-dom')
    };

    await container.init(shared);
  }

  // Preload a remote module for better performance
  async preloadRemoteModule(config: RemoteModuleConfig): Promise<void> {
    try {
      await this.loadRemoteModule(config);
    } catch (error) {
      console.warn('Failed to preload remote module:', error);
    }
  }

  // Clear cache if needed
  clearCache(): void {
    this.loadedScripts.clear();
    this.loadedContainers.clear();
  }
}

export const moduleFederation = new DynamicModuleFederation();

// Utility function for easy loading
export async function loadRemoteComponent<T = any>(
  remoteUrl: string,
  scope: string,
  module: string
): Promise<T> {
  return moduleFederation.loadRemoteModule<T>({
    url: remoteUrl,
    scope,
    module
  });
}

// React hook for loading remote components
import { useState, useEffect } from 'react';

export function useRemoteComponent<T = any>(
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
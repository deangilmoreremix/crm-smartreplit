import React, { lazy, Suspense } from 'react';

interface SafeFederatedImportProps {
  importer: () => Promise<{ default: React.ComponentType<any> }>;
  name: string;
  fallback?: React.ReactNode;
}

const DefaultErrorFallback: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ 
    padding: '20px', 
    backgroundColor: '#fef2f2', 
    border: '1px solid #fecaca',
    borderRadius: '8px',
    margin: '10px'
  }}>
    <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Failed to load remote: {name}</h3>
    <p style={{ color: '#6b7280', fontSize: '14px' }}>
      The remote module could not be loaded. This may be due to:
    </p>
    <ul style={{ color: '#6b7280', fontSize: '12px', marginLeft: '16px', marginTop: '8px' }}>
      <li>• Module Federation not configured correctly</li>
      <li>• Remote server unavailable</li>
      <li>• Network connectivity issues</li>
    </ul>
  </div>
);

const DefaultLoadingFallback: React.FC = () => (
  <div style={{ 
    padding: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <div style={{ 
      width: '24px', 
      height: '24px', 
      border: '3px solid #e5e7eb',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <span style={{ marginLeft: '8px', color: '#6b7280' }}>Loading...</span>
  </div>
);

export const safeLazy = (importer: () => Promise<{ default: React.ComponentType<any> }>, name: string) => {
  return lazy(async () => {
    try {
      console.log(`[SafeFederated] Loading module: ${name}`);
      const mod = await importer();
      
      if (!mod) {
        throw new Error(`${name} returned undefined`);
      }
      
      if (!mod.default) {
        throw new Error(`${name} missing default export`);
      }
      
      console.log(`[SafeFederated] Successfully loaded: ${name}`, { hasDefault: !!mod.default });
      return mod;
    } catch (err) {
      console.error(`[SafeFederated] Failed to load ${name}:`, err);
      
      return {
        default: function FallbackComponent() {
          return React.createElement(DefaultErrorFallback, { name });
        }
      };
    }
  });
};

export const SafeFederatedImport: React.FC<SafeFederatedImportProps> = ({
  importer,
  name,
  fallback
}) => {
  const SafeComponent = safeLazy(importer, name);
  
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <SafeComponent />
    </Suspense>
  );
};

export const validateFederationModule = async (
  url: string,
  scope: string,
  module: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    console.log(`[FederationValidator] Checking ${scope}/${module} from ${url}`);
    
    const remoteEntries = [
      `${url}/assets/remoteEntry.js`,
      `${url}/remoteEntry.js`
    ];
    
    let loaded = false;
    for (const entry of remoteEntries) {
      try {
        const response = await fetch(entry, { method: 'HEAD', mode: 'cors' });
        if (response.ok) {
          loaded = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!loaded) {
      return { valid: false, error: 'remoteEntry.js not accessible' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
};
import React, { useState, useEffect } from 'react';
import { useApiKeyStatus } from '../../hooks/useApiKeyStatus';
import { AIApiKeySettings } from './AIApiKeySettings';

interface AIApiKeySetupGuardProps {
  children: React.ReactNode;
}

export const AIApiKeySetupGuard: React.FC<AIApiKeySetupGuardProps> = ({ children }) => {
  const { hasApiKeys, isLoading } = useApiKeyStatus();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Show setup if user is loaded and doesn't have API keys
    if (!isLoading && hasApiKeys === false) {
      setShowSetup(true);
    }
  }, [hasApiKeys, isLoading]);

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AIApiKeySettings 
        open={showSetup}
        onOpenChange={setShowSetup}
      />
    </>
  );
};

export default AIApiKeySetupGuard;
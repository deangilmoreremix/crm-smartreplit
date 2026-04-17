import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AIConfigurationContextType {
  showAIProviderModal: boolean;
  setShowAIProviderModal: (show: boolean) => void;
  openAIProviderModal: () => void;
  closeAIProviderModal: () => void;
}

const AIConfigurationContext = createContext<AIConfigurationContextType | undefined>(undefined);

export const AIConfigurationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showAIProviderModal, setShowAIProviderModal] = useState(false);

  const openAIProviderModal = () => setShowAIProviderModal(true);
  const closeAIProviderModal = () => setShowAIProviderModal(false);

  return (
    <AIConfigurationContext.Provider
      value={{
        showAIProviderModal,
        setShowAIProviderModal,
        openAIProviderModal,
        closeAIProviderModal,
      }}
    >
      {children}
    </AIConfigurationContext.Provider>
  );
};

export const useAIConfiguration = () => {
  const context = useContext(AIConfigurationContext);
  if (context === undefined) {
    throw new Error('useAIConfiguration must be used within an AIConfigurationProvider');
  }
  return context;
};


import React, { createContext, useContext } from 'react';

interface AIContextValue {
  isProcessing: boolean;
}

const AIContext = createContext<AIContextValue | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AIContextValue = {
    isProcessing: false
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

export const useContactAI = (contactId: string) => {
  return {
    scoreContact: async (contact: any) => ({ overall: 75, reasoning: ['Good engagement'] }),
    generateInsights: async (contact: any, types: string[]) => ([]),
    contactScore: null,
    contactInsights: [],
    isContactProcessing: false
  };
};

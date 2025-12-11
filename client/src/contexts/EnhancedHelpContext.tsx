import React, { createContext, useContext, useState } from 'react';

interface EnhancedHelpContextType {
  showTours: boolean;
  setShowTours: (show: boolean) => void;
  currentTour: string | null;
  startTour: (tourName: string) => void;
  endTour: () => void;
}

const EnhancedHelpContext = createContext<EnhancedHelpContextType | undefined>(undefined);

export const useEnhancedHelp = () => {
  const context = useContext(EnhancedHelpContext);
  if (!context) {
    throw new Error('useEnhancedHelp must be used within an EnhancedHelpProvider');
  }
  return context;
};

export const EnhancedHelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTours, setShowTours] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);

  const startTour = (tourName: string) => {
    setCurrentTour(tourName);
    setShowTours(true);
  };

  const endTour = () => {
    setCurrentTour(null);
    setShowTours(false);
  };

  return (
    <EnhancedHelpContext.Provider value={{ showTours, setShowTours, currentTour, startTour, endTour }}>
      {children}
    </EnhancedHelpContext.Provider>
  );
};
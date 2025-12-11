import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoDataContextType {
  showDemoData: boolean;
  clearDemoData: () => void;
  restoreDemoData: () => void;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider = ({ children }: { children: ReactNode }) => {
  const [showDemoData, setShowDemoData] = useState(() => {
    const stored = localStorage.getItem('smartcrm_show_demo_data');
    return stored !== null ? stored === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('smartcrm_show_demo_data', String(showDemoData));
  }, [showDemoData]);

  const clearDemoData = () => {
    setShowDemoData(false);
  };

  const restoreDemoData = () => {
    setShowDemoData(true);
  };

  return (
    <DemoDataContext.Provider value={{ showDemoData, clearDemoData, restoreDemoData }}>
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (context === undefined) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
};

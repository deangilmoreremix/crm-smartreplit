import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useAnalyticsStore } from '../store/analyticsStore';

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
    // Keep every store that holds sample content in step with the toggle.
    useDealStore.getState().setDemoEnabled(showDemoData);
    useContactStore.getState().setDemoEnabled(showDemoData);
    useAppointmentStore.getState().setDemoEnabled(showDemoData);
    useAnalyticsStore.getState().setDemoEnabled(showDemoData);
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

/** Like useDemoData but safe outside a provider: sample data is simply off. */
export const useDemoDataSafe = (): { showDemoData: boolean } => {
  const context = useContext(DemoDataContext);
  return { showDemoData: context?.showDemoData ?? false };
};

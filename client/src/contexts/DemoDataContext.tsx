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

const STORAGE_KEY = 'smartcrm_show_demo_data';

const readStoredFlag = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  } catch {
    return true; // SSR / private mode: default to sample data on
  }
};

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider = ({ children }: { children: ReactNode }) => {
  const [showDemoData, setShowDemoData] = useState(readStoredFlag);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showDemoData));
    } catch {
      /* storage unavailable: the flag just won't persist */
    }
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

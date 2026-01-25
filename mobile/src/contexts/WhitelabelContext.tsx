import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WhitelabelConfig } from '../types/whitelabel';

interface WhitelabelContextType {
  config: WhitelabelConfig;
  loading: boolean;
  updateConfig: (updates: Partial<WhitelabelConfig>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const WhitelabelContext = createContext<WhitelabelContextType | undefined>(undefined);

const STORAGE_KEY = '@whitelabel_config';

export const useWhitelabel = () => {
  const context = useContext(WhitelabelContext);
  if (!context) {
    throw new Error('useWhitelabel must be used within a WhitelabelProvider');
  }
  return context;
};

interface WhitelabelProviderProps {
  children: React.ReactNode;
  config: WhitelabelConfig;
}

export const WhitelabelProvider: React.FC<WhitelabelProviderProps> = ({
  children,
  config: defaultConfig
}) => {
  const [config, setConfig] = useState<WhitelabelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  // Load config from AsyncStorage on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          // Merge with default config to ensure all properties exist
          setConfig({ ...defaultConfig, ...parsedConfig });
        }
      } catch (error) {
        console.error('Error loading whitelabel config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [defaultConfig]);

  // Save config to AsyncStorage whenever it changes
  const updateConfig = async (updates: Partial<WhitelabelConfig>) => {
    try {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);

      // Save to AsyncStorage
      const configString = JSON.stringify(newConfig);
      await AsyncStorage.setItem(STORAGE_KEY, configString);
    } catch (error) {
      console.error('Error saving whitelabel config:', error);
      throw error;
    }
  };

  const resetToDefault = async () => {
    try {
      setConfig(defaultConfig);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting whitelabel config:', error);
      throw error;
    }
  };

  const value: WhitelabelContextType = {
    config,
    loading,
    updateConfig,
    resetToDefault,
  };

  return (
    <WhitelabelContext.Provider value={value}>
      {children}
    </WhitelabelContext.Provider>
  );
};
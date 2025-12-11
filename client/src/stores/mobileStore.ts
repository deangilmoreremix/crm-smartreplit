import { create } from 'zustand';

interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
}

interface MobileStore extends MobileState {
  // Actions
  updateScreenSize: (width: number, height: number) => void;
  updateOrientation: (orientation: 'portrait' | 'landscape') => void;
  detectDevice: () => void;
}

export const useMobileStore = create<MobileStore>((set, get) => ({
  isMobile: false,
  isTablet: false,
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
  screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  orientation: 'portrait',
  touchEnabled: typeof window !== 'undefined' ? 'ontouchstart' in window : false,

  updateScreenSize: (width: number, height: number) => {
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const orientation = height > width ? 'portrait' : 'landscape';

    set({
      screenWidth: width,
      screenHeight: height,
      isMobile,
      isTablet,
      orientation
    });
  },

  updateOrientation: (orientation: 'portrait' | 'landscape') => {
    set({ orientation });
  },

  detectDevice: () => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const orientation = height > width ? 'portrait' : 'landscape';
    const touchEnabled = 'ontouchstart' in window;

    set({
      screenWidth: width,
      screenHeight: height,
      isMobile,
      isTablet,
      orientation,
      touchEnabled
    });
  }
}));
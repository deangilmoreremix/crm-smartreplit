// Enhanced Module Federation - Shared Stores
export { useContactStore } from './contactStore';
export { useDealStore } from './dealStore';
export { useTaskStore } from './taskStore';
export { useAuthStore } from './authStore';
export { useCommunicationStore } from './communicationStore';
export { useGoalStore } from './goalStore';
export { useAnalyticsStore } from './analyticsStore';
export { useMobileStore } from './mobileStore';

// Re-export Zustand for remote apps
export { create } from 'zustand';
export { persist, createJSONStorage } from 'zustand/middleware';

// Store utilities
export * from './storeUtils';
import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useSafeNavigate } from '../components/record-table/useSafeNavigate';
import { APP_ROUTES } from '../utils/appLinks';
import { useAITools, AIToolType } from '../components/AIToolsProvider';

interface NavigationContextType {
  scrollToSection: (sectionId: string) => void;
  openAITool: (toolName: string) => void;
  navigateToFeature: (feature: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const routerNavigate = useSafeNavigate();
  const [currentPath, setCurrentPath] = React.useState('');

  // Safe access to AITools with error handling
  let openTool: ((tool: AIToolType) => void) | null = null;
  try {
    const aiTools = useAITools();
    openTool = aiTools?.openTool || null;
  } catch (error) {
    // AIToolsProvider not available - continue without AI tools
    openTool = null;
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    }
  };

  const openAITool = (toolName: string) => {
    if (openTool) {
      // Cast string to AIToolType for compatibility
      openTool(toolName as AIToolType);
    }
  };

  const navigateToFeature = (feature: string) => {
    switch (feature) {
      case 'dashboard':
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
          console.error('Error scrolling to top:', error);
        }
        break;
      case 'contacts':
        try {
          scrollToSection('customer-lead-management');
        } catch (error) {
          console.error('Error navigating to contacts:', error);
        }
        break;
      case 'pipeline':
        scrollToSection('pipeline-section');
        break;
      case 'ai-tools':
        scrollToSection('ai-smart-features-hub');
        break;
      case 'tasks':
        scrollToSection('tasks-section');
        break;
      case 'analytics':
        scrollToSection('analytics-section');
        break;
      case 'apps':
        scrollToSection('apps-section');
        break;
      // Dashboard section ids (and plain paths) resolve to their full pages.
      case 'pipeline-section':
        routerNavigate(APP_ROUTES.pipeline);
        break;
      case 'analytics-section':
        routerNavigate(APP_ROUTES.analytics);
        break;
      case 'contacts-section':
      case 'customer-lead-management':
        routerNavigate(APP_ROUTES.contacts);
        break;
      case 'tasks-section':
      case 'activities-communications':
        routerNavigate(APP_ROUTES.tasks);
        break;
      case 'ai-smart-features-hub':
        routerNavigate(APP_ROUTES.aiTools);
        break;
      case 'calendar':
        routerNavigate(APP_ROUTES.calendar);
        break;
      case '/deals':
      case '/contacts':
      case '/tasks':
      case '/settings':
        routerNavigate(feature);
        break;
      default:
        console.warn(`navigateToFeature: unknown feature "${feature}"`);
    }
  };

  const navigate = useCallback(
    (path: string, options?: any) => {
      if (path === currentPath) return;

      // Debounce navigation to prevent rapid fire
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
      navigationTimeoutRef.current = window.setTimeout(() => {
        setCurrentPath(path);
        routerNavigate(path, options as any);
      }, 100);
    },
    [currentPath, routerNavigate]
  );

  // Add ref for timeout
  const navigationTimeoutRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <NavigationContext.Provider value={{ scrollToSection, openAITool, navigateToFeature }}>
      {children}
    </NavigationContext.Provider>
  );
};

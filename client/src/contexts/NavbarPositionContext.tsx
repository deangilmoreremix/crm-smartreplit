import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NavbarPosition = 'top' | 'left' | 'right' | 'bottom';

interface NavbarPositionState {
  position: NavbarPosition;
  isDragging: boolean;
  isMinimized: boolean;
}

interface NavbarPositionContextType {
  position: NavbarPosition;
  isDragging: boolean;
  isMinimized: boolean;
  setPosition: (position: NavbarPosition) => void;
  setIsDragging: (isDragging: boolean) => void;
  toggleMinimized: () => void;
}

const NavbarPositionContext = createContext<NavbarPositionContextType | undefined>(undefined);

interface NavbarPositionProviderProps {
  children: ReactNode;
}

export const NavbarPositionProvider: React.FC<NavbarPositionProviderProps> = ({ children }) => {
  const [position, setPositionState] = useState<NavbarPosition>('top');
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load position and minimized state from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('navbar-position') as NavbarPosition;
    if (savedPosition && ['top', 'left', 'right', 'bottom'].includes(savedPosition)) {
      setPositionState(savedPosition);
    }
    
    const savedMinimized = localStorage.getItem('navbar-minimized');
    if (savedMinimized === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // Save position to localStorage when it changes
  const setPosition = (newPosition: NavbarPosition) => {
    setPositionState(newPosition);
    localStorage.setItem('navbar-position', newPosition);
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(prev => {
      const newValue = !prev;
      localStorage.setItem('navbar-minimized', String(newValue));
      return newValue;
    });
  };

  const value: NavbarPositionContextType = {
    position,
    isDragging,
    isMinimized,
    setPosition,
    setIsDragging,
    toggleMinimized,
  };

  return (
    <NavbarPositionContext.Provider value={value}>
      {children}
    </NavbarPositionContext.Provider>
  );
};

export const useNavbarPosition = (): NavbarPositionContextType => {
  const context = useContext(NavbarPositionContext);
  if (context === undefined) {
    throw new Error('useNavbarPosition must be used within a NavbarPositionProvider');
  }
  return context;
};
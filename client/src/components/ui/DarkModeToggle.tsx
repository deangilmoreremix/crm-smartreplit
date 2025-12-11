import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ModernButton } from './ModernButton';

export const DarkModeToggle: React.FC = () => {
  const [isDark, setIsDark] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark', !isDark);
  };

  return (
    <ModernButton
      onClick={toggleDarkMode}
      variant="ghost"
      size="sm"
      className="p-2"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </ModernButton>
  );
};
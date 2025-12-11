// Enhanced Module Federation - Shared Contexts
export { RemoteAppProvider, useRemoteApps } from './RemoteAppContext';
export { AuthProvider, useAuth } from './AuthContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { NavigationProvider, useNavigation } from './NavigationContext';
export { DashboardLayoutProvider, useDashboardLayout } from './DashboardLayoutContext';
export { TenantProvider, useTenant } from './TenantProvider';
export { VideoCallProvider, useVideoCall } from './VideoCallContext';
export { WhitelabelProvider, useWhitelabel } from './WhitelabelContext';
export { EnhancedHelpProvider, useEnhancedHelp } from './EnhancedHelpContext';
export { NavbarPositionProvider, useNavbarPosition } from './NavbarPositionContext';

// Re-export React context utilities
export { createContext, useContext } from 'react';
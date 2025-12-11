import React, { useEffect, useState } from 'react';
import { useMobileStore } from '../../store/mobileStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RotateCcw,
  Settings,
  Activity,
  Zap,
  Download,
  Upload,
  Bell,
  Hand
} from 'lucide-react';

export default function MobileResponsiveDashboard() {
  const {
    deviceInfo,
    viewport,
    isOnline,
    isMobile,
    isTablet,
    orientation,
    offlineData,
    syncStatus,
    notifications,
    touchEvents,
    gesturesEnabled,
    performanceMode,
    detectDevice,
    syncOfflineData,
    setPerformanceMode,
    setGesturesEnabled,
    addNotification,
    getBreakpoint,
    isMobileSize,
    isTabletSize,
    isDesktopSize
  } = useMobileStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    detectDevice();
  }, [detectDevice]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncOfflineData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const testNotification = () => {
    addNotification({
      title: 'Test Notification',
      message: 'This is a test mobile notification',
      type: 'info',
      persistent: false,
      position: 'top',
      duration: 3000
    });
  };

  const currentBreakpoint = getBreakpoint();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mobile Responsiveness</h1>
            <p className="text-gray-600">Mobile optimization and responsive design controls</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant="outline">
              {currentBreakpoint.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Device Information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Type</CardTitle>
              {isMobile ? <Smartphone className="h-4 w-4" /> : 
               isTablet ? <Tablet className="h-4 w-4" /> : 
               <Monitor className="h-4 w-4" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
              </div>
              <p className="text-xs text-muted-foreground">
                {deviceInfo?.platform || 'Web'} • {viewport.width}×{viewport.height}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orientation</CardTitle>
              <RotateCcw className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{orientation}</div>
              <p className="text-xs text-muted-foreground">
                {viewport.width > viewport.height ? 'Landscape' : 'Portrait'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
              {syncStatus.syncInProgress ? <Upload className="h-4 w-4 animate-spin" /> : 
               offlineData.length > 0 ? <Download className="h-4 w-4" /> : 
               <Activity className="h-4 w-4" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStatus.pendingChanges}</div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.syncInProgress ? 'Syncing...' : 'Pending changes'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Zap className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{performanceMode}</div>
              <p className="text-xs text-muted-foreground">
                Performance mode
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={handleRefresh}
                disabled={refreshing || !isOnline}
                className="flex items-center gap-2"
                size="sm"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync Data'}
              </Button>
              
              <Button 
                onClick={testNotification}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Bell className="w-4 h-4" />
                Test Notification
              </Button>
              
              <Button 
                onClick={() => setGesturesEnabled(!gesturesEnabled)}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Hand className="w-4 h-4" />
                {gesturesEnabled ? 'Disable' : 'Enable'} Gestures
              </Button>
              
              <Button 
                onClick={detectDevice}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <Settings className="w-4 h-4" />
                Refresh Device Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Breakpoints Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Breakpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['sm', 'md', 'lg', 'xl'].map((bp) => (
                  <div 
                    key={bp}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      currentBreakpoint === bp ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <h4 className="font-medium uppercase">{bp}</h4>
                    <p className="text-sm text-gray-600">
                      {bp === 'sm' && '< 640px'}
                      {bp === 'md' && '640px - 768px'}
                      {bp === 'lg' && '768px - 1024px'}
                      {bp === 'xl' && '> 1024px'}
                    </p>
                    <Badge variant={currentBreakpoint === bp ? 'default' : 'outline'} className="mt-2">
                      {currentBreakpoint === bp ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant={isMobileSize() ? 'default' : 'outline'}>
                  Mobile Size: {isMobileSize() ? 'Yes' : 'No'}
                </Badge>
                <Badge variant={isTabletSize() ? 'default' : 'outline'}>
                  Tablet Size: {isTabletSize() ? 'Yes' : 'No'}
                </Badge>
                <Badge variant={isDesktopSize() ? 'default' : 'outline'}>
                  Desktop Size: {isDesktopSize() ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Capabilities */}
        {deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Device Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(deviceInfo.capabilities).map(([capability, supported]) => (
                  <div key={capability} className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      supported ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {capability === 'touch' && <Hand className="w-5 h-5" />}
                      {capability === 'camera' && <Settings className="w-5 h-5" />}
                      {capability === 'location' && <Activity className="w-5 h-5" />}
                      {capability === 'push' && <Bell className="w-5 h-5" />}
                      {capability === 'biometric' && <Zap className="w-5 h-5" />}
                      {capability === 'nfc' && <Wifi className="w-5 h-5" />}
                    </div>
                    <p className="text-xs font-medium capitalize">{capability}</p>
                    <Badge variant={supported ? 'default' : 'outline'} className="text-xs">
                      {supported ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Performance Mode</label>
                <div className="flex gap-2">
                  {(['auto', 'power_save', 'performance'] as const).map((mode) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={performanceMode === mode ? 'default' : 'outline'}
                      onClick={() => setPerformanceMode(mode)}
                    >
                      {mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Auto Mode</h4>
                  <p className="text-sm text-gray-600">
                    Automatically adjusts performance based on device capabilities and battery level.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Power Save</h4>
                  <p className="text-sm text-gray-600">
                    Reduces animations and background processes to save battery.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch Events (Mobile Only) */}
        {(isMobile || isTablet) && touchEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Touch Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {touchEvents.slice(-5).map((event) => (
                  <div key={event.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize">{event.type.replace('_', ' ')}</span>
                      <span className="text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      Position: ({event.position.x}, {event.position.y})
                      {event.delta && ` | Delta: (${event.delta.x}, ${event.delta.y})`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offline Data */}
        {offlineData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Offline Data Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {offlineData.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{item.action}</span>
                      <span className="text-gray-500 ml-2">{item.type}</span>
                    </div>
                    <Badge variant={item.synced ? 'default' : 'outline'}>
                      {item.synced ? 'Synced' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                {offlineData.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{offlineData.length - 5} more items
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile-Specific Features Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile-First Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Touch-friendly buttons */}
              <div>
                <h4 className="font-medium mb-2">Touch-Friendly Buttons</h4>
                <div className="flex gap-2">
                  <Button size="lg" className="touch-target">Large</Button>
                  <Button size="sm">Small</Button>
                </div>
              </div>
              
              {/* Swipeable card demo */}
              <div>
                <h4 className="font-medium mb-2">Swipeable Cards</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">
                    👈 Swipe left or right on mobile devices
                  </p>
                </div>
              </div>
              
              {/* Bottom sheet simulation */}
              <div>
                <h4 className="font-medium mb-2">Mobile Modals</h4>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => addNotification({
                    title: 'Modal Simulation',
                    message: 'On mobile, this would be a bottom sheet',
                    type: 'info',
                    persistent: false,
                    position: 'bottom',
                    duration: 3000
                  })}
                >
                  Show Mobile Modal
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsive Layout Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grid that changes based on screen size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div 
                      key={num}
                      className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded text-center text-sm"
                    >
                      Item {num}
                    </div>
                  ))}
                </div>
                
                {/* Responsive text */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg">
                    This text scales with screen size
                  </p>
                </div>
                
                {/* Hidden on mobile */}
                <div className="hidden md:block p-2 bg-yellow-100 rounded-lg">
                  <p className="text-sm">This is hidden on mobile devices</p>
                </div>
                
                {/* Mobile only */}
                <div className="block md:hidden p-2 bg-green-100 rounded-lg">
                  <p className="text-sm">This only shows on mobile devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

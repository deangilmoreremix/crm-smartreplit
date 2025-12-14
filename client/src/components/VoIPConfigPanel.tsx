import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { voipService, VoIPConfig } from '../services/voip/VoIPService';

interface VoIPConfigPanelProps {
  onClose?: () => void;
}

const VoIPConfigPanel: React.FC<VoIPConfigPanelProps> = ({ onClose }: VoIPConfigPanelProps) => {
  const { isDark } = useTheme();
  const [availableProviders, setAvailableProviders] = useState<Array<{
    name: string;
    displayName: string;
    description: string;
    website: string;
  }>>([]);

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isEnabled, setIsEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load available providers
    const providers = voipService.getAvailableProviders();
    setAvailableProviders(providers);

    // Load current configuration
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      await voipService.loadConfig();
      const currentProvider = voipService.getCurrentProvider();
      if (currentProvider) {
        setSelectedProvider(currentProvider.name);
        setIsEnabled(voipService.isEnabled());
      }
    } catch (error) {
      console.error('Failed to load VoIP config:', error);
    }
  };

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    setConfig({});
    setTestResult(null);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: Record<string, any>) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const testConfiguration = async () => {
    if (!selectedProvider) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const testConfig: VoIPConfig = {
        provider: selectedProvider,
        config,
        enabled: true
      };

      const result = await voipService.testConfig(testConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!selectedProvider) return;

    setIsSaving(true);

    try {
      const voipConfig: VoIPConfig = {
        provider: selectedProvider,
        config,
        enabled: isEnabled
      };

      await voipService.saveConfig(voipConfig);

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save VoIP config:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Save failed'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getConfigSchema = () => {
    if (!selectedProvider) return [];
    return voipService.getProviderConfigSchema(selectedProvider) || [];
  };

  const selectedProviderInfo = availableProviders.find((p: any) => p.name === selectedProvider);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            VoIP Configuration
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure your preferred VoIP provider for video calling
          </p>
        </div>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select VoIP Provider</CardTitle>
          <CardDescription>
            Choose your preferred VoIP service provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProviders.map((provider: any) => (
              <div
                key={provider.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedProvider === provider.name
                    ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                    : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleProviderChange(provider.name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {provider.displayName}
                    </h4>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {provider.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProvider === provider.name && (
                      <span className="text-blue-500">✓</span>
                    )}
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      onClick={(e: any) => e.stopPropagation()}
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Configure {selectedProviderInfo?.displayName}</CardTitle>
            <CardDescription>
              Enter your {selectedProviderInfo?.displayName} credentials and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getConfigSchema().map((field: any) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'select' && field.options ? (
                  <Select
                    value={config[field.key] || ''}
                    onValueChange={(value: string) => handleConfigChange(field.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={field.key}
                      checked={config[field.key] || false}
                      onCheckedChange={(checked: boolean) => handleConfigChange(field.key, checked)}
                    />
                    <Label htmlFor={field.key}>{field.label}</Label>
                  </div>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={config[field.key] || ''}
                    onChange={(e: any) => handleConfigChange(field.key, e.target.value)}
                  />
                )}

                {field.description && (
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {field.description}
                  </p>
                )}
              </div>
            ))}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label htmlFor="enabled">Enable VoIP Calling</Label>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Allow users to make video and audio calls
                </p>
              </div>
              <Switch
                id="enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResult && (
        <div className={`p-4 rounded-lg border ${
          testResult.success
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-red-500 bg-red-50 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            <span>{testResult.success ? '✓' : '✗'}</span>
            <span>{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testConfiguration}
            disabled={!selectedProvider || isTesting || isSaving}
          >
            {isTesting ? 'Testing...' : 'Test Configuration'}
          </Button>

          <Button
            onClick={saveConfiguration}
            disabled={!selectedProvider || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoIPConfigPanel;
import React, { useState, useEffect } from 'react';
import {
  Bot,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AIProviderSettingsProps {
  className?: string;
}

// Define provider info locally for UI (actual providers are handled server-side)
const PROVIDER_INFO = {
  openai: { name: 'OpenAI', type: 'direct' },
  openrouter: { name: 'OpenRouter', type: 'aggregator' },
  anthropic: { name: 'Anthropic', type: 'direct' },
  google: { name: 'Google AI', type: 'direct' },
  together: { name: 'Together AI', type: 'aggregator' },
  groq: { name: 'Groq', type: 'aggregator' },
  cohere: { name: 'Cohere', type: 'direct' },
  mistral: { name: 'Mistral', type: 'direct' },
  deepinfra: { name: 'DeepInfra', type: 'aggregator' },
  fireworks: { name: 'Fireworks', type: 'aggregator' },
  perplexity: { name: 'Perplexity', type: 'aggregator' },
};

// Simple local key manager for client-side storage
const LocalKeyManager = {
  STORAGE_KEY: 'smartcrm_api_keys',

  encrypt(text: string): string {
    // Simple XOR encryption for demo
    const key = 'smartcrm_encryption_key';
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  },

  decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      const key = 'smartcrm_encryption_key';
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch {
      return '';
    }
  },

  getKeys(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((key: any) => ({
        ...key,
        createdAt: new Date(key.createdAt),
        lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : undefined,
        apiKey: this.decrypt(key.apiKey),
      }));
    } catch {
      return [];
    }
  },

  setKey(providerId: string, apiKey: string): void {
    const keys = this.getKeys();
    const existingIndex = keys.findIndex((k) => k.providerId === providerId);

    const encryptedKey = this.encrypt(apiKey);
    const keyData = {
      providerId,
      apiKey: encryptedKey,
      isActive: true,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    if (existingIndex >= 0) {
      keys[existingIndex] = keyData;
    } else {
      keys.push(keyData);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  },

  removeKey(providerId: string): void {
    const keys = this.getKeys().filter((k) => k.providerId !== providerId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  },

  getConfiguredProviders(): string[] {
    return this.getKeys().map((k) => k.providerId);
  },
};

const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ className }) => {
  const { toast } = useToast();
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguredProviders();
  }, []);

  const loadConfiguredProviders = () => {
    const configured = LocalKeyManager.getConfiguredProviders();
    setConfiguredProviders(configured);
  };

  const handleAddProvider = () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a provider and enter an API key.',
        variant: 'destructive',
      });
      return;
    }

    try {
      LocalKeyManager.setKey(selectedProvider, apiKey.trim());
      setApiKey('');
      setSelectedProvider('');
      loadConfiguredProviders();
      toast({
        title: 'Provider Added',
        description: `Successfully added ${PROVIDER_INFO[selectedProvider as keyof typeof PROVIDER_INFO]?.name || selectedProvider} provider.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveProvider = (providerId: string) => {
    try {
      LocalKeyManager.removeKey(providerId);
      loadConfiguredProviders();
      toast({
        title: 'Provider Removed',
        description: `Successfully removed ${PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name || providerId} provider.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove provider. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const testProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const response = await fetch('/.netlify/functions/ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerId,
          model:
            providerId === 'openai'
              ? 'gpt-5.4'
              : providerId === 'openrouter'
                ? 'openai/gpt-5.4'
                : providerId === 'anthropic'
                  ? 'claude-3.5-sonnet-20241022'
                  : 'gpt-3.5-turbo', // fallback
          messages: [{ role: 'user', content: 'Hello, test message' }],
          maxTokens: 50,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Test Successful',
          description: `${PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name || providerId} provider is working correctly.`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Unknown error');
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: `Failed to connect to ${PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name || providerId}: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const availableProviders = Object.keys(PROVIDER_INFO).filter(
    (providerId) => !configuredProviders.includes(providerId)
  );

  const errors = CustomProviderManager.validateCustomProvider(customConfig);
  if (errors.length > 0) {
    toast({
      title: 'Validation Error',
      description: errors.join(', '),
      variant: 'destructive',
    });
    return;
  }

  const provider = {
    id: customProviderForm.id,
    name: customProviderForm.name,
    type: 'direct' as const,
    baseUrl: customProviderForm.baseUrl,
    apiKeyRequired: true,
    models: [], // Will be populated when connected
    capabilities: customProviderForm.capabilities as any[],
  };

  CustomProviderManager.addCustomProvider(provider);

  // Reset form
  setCustomProviderForm({
    id: '',
    name: '',
    baseUrl: '',
    chatEndpoint: '/chat/completions',
    modelsEndpoint: '/models',
    authType: 'bearer',
    authHeader: 'Authorization',
    responseFormat: 'openai',
    description: '',
    capabilities: [],
  });

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Provider Settings
          </CardTitle>
          <CardDescription>
            Configure your own AI provider API keys to enable AI features. Keys are encrypted and
            stored locally in your browser. You pay for your own AI usage directly to the providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Provider Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add New Provider</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="provider-select">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map((providerId) => (
                      <SelectItem key={providerId} value={providerId}>
                        <div className="flex items-center gap-2">
                          <span>
                            {PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name ||
                              providerId}
                          </span>
                          <Badge
                            variant={
                              PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.type ===
                              'direct'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.type ||
                              'unknown'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddProvider} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </div>
            </div>
          </div>

          {/* Configured Providers */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configured Providers</h3>
            {configuredProviders.length === 0 ? (
              <p className="text-muted-foreground">No providers configured yet.</p>
            ) : (
              <div className="space-y-3">
                {configuredProviders.map((providerId) => (
                  <Card key={providerId}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium">
                              {PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name ||
                                providerId}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.type ===
                                  'direct'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.type ||
                                  'unknown'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                AI models available
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testProvider(providerId)}
                            disabled={testingProvider === providerId}
                          >
                            {testingProvider === providerId ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Test
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProvider(providerId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIProviderSettings;

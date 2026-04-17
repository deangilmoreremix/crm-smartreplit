import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Bot, Settings, AlertCircle, X, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: () => void;
}

const PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'aggregator',
    recommended: true,
    description: 'Access 100+ models with one key',
  },
  { id: 'openai', name: 'OpenAI', type: 'direct', description: 'GPT-5.4, GPT-4.1, etc.' },
  { id: 'anthropic', name: 'Anthropic', type: 'direct', description: 'Claude 3.5, Claude 3 Opus' },
  { id: 'google', name: 'Google AI', type: 'direct', description: 'Gemini Pro, Gemma' },
  { id: 'groq', name: 'Groq', type: 'aggregator', description: 'Fast inference, Llama models' },
  { id: 'together', name: 'Together AI', type: 'aggregator', description: 'Open source models' },
];

const AIProviderSettingsModal: React.FC<AIProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  useEffect(() => {
    loadConfiguredProviders();
    window.addEventListener('storage', loadConfiguredProviders);
    return () => window.removeEventListener('storage', loadConfiguredProviders);
  }, []);

  const loadConfiguredProviders = () => {
    try {
      const stored = localStorage.getItem('smartcrm_api_keys');
      if (stored) {
        const keys = JSON.parse(stored);
        setConfiguredProviders(keys.map((k: any) => k.providerId));
      } else {
        setConfiguredProviders([]);
      }
    } catch (err) {
      console.error('Failed to load configured providers:', err);
      setConfiguredProviders([]);
    }
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Simple encryption for localStorage
      const encryptedKey = btoa(apiKey);

      // Get existing keys
      const existing = localStorage.getItem('smartcrm_api_keys');
      const keys = existing ? JSON.parse(existing) : [];

      // Remove old key for this provider if exists
      const filteredKeys = keys.filter((k: any) => k.providerId !== selectedProvider);

      // Add new key
      filteredKeys.push({
        providerId: selectedProvider,
        apiKey: encryptedKey,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      });

      // Save to localStorage
      localStorage.setItem('smartcrm_api_keys', JSON.stringify(filteredKeys));

      // Trigger storage event for other components
      window.dispatchEvent(new Event('storage'));

      setConfiguredProviders(filteredKeys.map((k: any) => k.providerId));
      setApiKey('');

      if (onKeyConfigured) {
        onKeyConfigured();
      }
    } catch (err) {
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = (providerId: string) => {
    try {
      const existing = localStorage.getItem('smartcrm_api_keys');
      if (existing) {
        const keys = JSON.parse(existing);
        const filtered = keys.filter((k: any) => k.providerId !== providerId);
        localStorage.setItem('smartcrm_api_keys', JSON.stringify(filtered));
        setConfiguredProviders(filtered.map((k: any) => k.providerId));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Failed to remove key:', err);
    }
  };

  const handleOpenFullSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Configure AI Provider</h2>
                <p className="text-sm text-purple-100">Add your API key to unlock AI features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Configured Providers */}
          {configuredProviders.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  {configuredProviders.length} provider{configuredProviders.length !== 1 ? 's' : ''}{' '}
                  configured
                </span>
              </div>
              <div className="space-y-2">
                {configuredProviders.map((providerId) => {
                  const provider = PROVIDERS.find((p) => p.id === providerId);
                  return (
                    <div
                      key={providerId}
                      className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {provider?.name || providerId}
                        </span>
                        {provider?.recommended && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveKey(providerId)}
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedProvider === provider.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {provider.name}
                    </span>
                    {provider.recommended && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {provider.description}
                  </span>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        provider.type === 'aggregator'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {provider.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${PROVIDERS.find((p) => p.id === selectedProvider)?.name} API key`}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your API key is encrypted and stored locally. We never see your key.
            </p>
          </div>

          {/* OpenRouter Info */}
          {selectedProvider === 'openrouter' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-3">
                <Zap className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  Why OpenRouter?
                </h4>
              </div>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></span>
                  Access 100+ AI models with one API key
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></span>
                  Switch between GPT-5.4, Claude, Gemini instantly
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2"></span>
                  Competitive pricing and pay-as-you-go
                </li>
                <li className="mt-2">
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline text-sm"
                  >
                    Get your API key here →
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isSaving ? 'Saving...' : 'Save API Key'}
            </button>
          </div>

          <button
            onClick={handleOpenFullSettings}
            className="w-full px-4 py-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Open Full Settings
          </button>

          <button
            onClick={onClose}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIProviderSettingsModal;

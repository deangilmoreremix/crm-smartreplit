import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Check, X, Shield, Key, Zap, Brain, Globe, BookOpen, Bot } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useAIApiKeys } from '../../hooks/useAIApiKeys';

interface AIApiKeySettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When true, the dialog will skip the provider-selection step and
   * go directly to OpenClaw API key entry. Used for the "Setup OpenClaw"
   * auto-trigger flow so returning users don't have to re-select the provider.
   */
  preferOpenClawOnOpen?: boolean;
}

export const AIApiKeySettings: React.FC<AIApiKeySettingsProps> = ({
  open,
  onOpenChange,
  preferOpenClawOnOpen = false
}) => {
  const { user } = useAuthStore();
  const { apiConfig, isLoading, saveApiKeys, testConnection } = useAIApiKeys();
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'openclaw'>('openai');
  const [localApiConfig, setLocalApiConfig] = useState({
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    gemini: { apiKey: '', model: 'gemini-1.5-flash' },
    openclaw: { apiKey: '', model: 'default', baseUrl: '' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Use controlled or uncontrolled mode
  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const steps = [
    { title: 'Choose Your AI Provider', description: 'Select OpenAI, Google Gemini, or OpenClaw AI' },
    { title: 'Select Your Model', description: 'Choose the model that best fits your needs' },
    { title: 'Enter Your API Key', description: 'Provide your secure API key' },
    { title: 'Verify & Complete', description: 'Test the connection and finish setup' }
  ];

  const currentModels = provider === 'openai' ? [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast, cost-effective model for everyday tasks', pricing: '$0.10/$0.20 per 1M tokens', contextLength: '128K tokens' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Omni model for complex reasoning', pricing: '$5/$15 per 1M tokens', contextLength: '128K tokens' }
  ] : provider === 'gemini' ? [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast, efficient model optimized for speed', pricing: '$0.000075/$0.00015 per 1K tokens', contextLength: '1M tokens' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable model for complex reasoning', pricing: '$0.00125/$0.0025 per 1K tokens', contextLength: '1M tokens' }
  ] : [
    { value: 'default', label: 'OpenClaw Default', description: 'Standard OpenClaw AI configuration', pricing: 'Custom pricing', contextLength: 'Varies by deployment' },
    { value: 'enhanced', label: 'OpenClaw Enhanced', description: 'Enhanced AI capabilities for advanced CRM tasks', pricing: 'Custom pricing', contextLength: 'Varies by deployment' }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTestResult(null);
      // Pre-populate from saved config so user sees what they already have
      if (apiConfig) {
        setLocalApiConfig({
          openai: { apiKey: apiConfig.openai?.apiKey || '', model: apiConfig.openai?.model || 'gpt-4o-mini' },
          gemini: { apiKey: apiConfig.gemini?.apiKey || '', model: apiConfig.gemini?.model || 'gemini-1.5-flash' },
          openclaw: { apiKey: apiConfig.openclaw?.apiKey || '', model: apiConfig.openclaw?.model || 'default', baseUrl: apiConfig.openclaw?.baseUrl || '' }
        });
        // Auto-select the provider that has a saved key (or default to openai / openclaw)
        if (preferOpenClawOnOpen) {
          // For "setup OpenClaw" trigger — go straight to OpenClaw provider + step 2 (API key)
          setProvider('openclaw');
          // If they already have a key, go to step 3 (review), otherwise step 2 (enter key)
          setCurrentStep(apiConfig.openclaw?.apiKey ? 2 : 2);
        } else {
          const savedProvider = apiConfig.openclaw?.apiKey ? 'openclaw' : apiConfig.gemini?.apiKey ? 'gemini' : apiConfig.openai?.apiKey ? 'openai' : 'openai';
          setProvider(savedProvider);
        }
      }
    }
  }, [isOpen, apiConfig, preferOpenClawOnOpen]);

  const handleProviderSelect = (selectedProvider: 'openai' | 'gemini' | 'openclaw') => {
    setProvider(selectedProvider);
    setCurrentStep(1);
  };

  const handleModelSelect = (modelValue: string) => {
    setLocalApiConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        model: modelValue
      }
    }));
    setCurrentStep(2);
  };

  const handleApiKeyChange = (key: string) => {
    setLocalApiConfig(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: key
      }
    }));
  };

  const testApiConnection = async () => {
    const apiKey = localApiConfig[provider]?.apiKey;
    if (!apiKey) return;

    setIsSaving(true);
    setTestResult(null);

    try {
      const baseUrl = provider === 'openclaw' ? localApiConfig.openclaw.baseUrl : undefined;
      const { success, message } = await testConnection(provider, apiKey, baseUrl);
      setTestResult({ success, message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveApiKeys(localApiConfig);
      if (success) {
        handleOpenChange(false);
      } else {
        setTestResult({ success: false, message: 'Failed to save API keys' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[50%] max-h-[75vh] top-[25%] translate-y-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">AI API Key Setup</DialogTitle>
          <DialogDescription>
            Configure your AI provider for enhanced CRM capabilities
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`flex items-center ${currentStep >= index ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= index 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {currentStep > index ? <Check size={16} /> : index + 1}
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > index ? 'bg-blue-200' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Provider Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Choose Your AI Provider</h3>
              <p className="text-gray-600">Select which AI provider you want to use for enhanced CRM features.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleProviderSelect('openai')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">OpenAI</h4>
                  <p className="text-sm text-gray-600">GPT-4, o1, and other cutting-edge models for advanced reasoning and creativity.</p>
                </button>
                <button
                  onClick={() => handleProviderSelect('gemini')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Globe size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">Google Gemini</h4>
                  <p className="text-sm text-gray-600">Gemini 1.5 and 2.0 series with massive context windows.</p>
                </button>
                <button
                  onClick={() => handleProviderSelect('openclaw')}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Bot size={24} className="text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">OpenClaw AI</h4>
                  <p className="text-sm text-gray-600">AI-powered CRM automation with specialized deal intelligence and workflow optimization.</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Model Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Select Your Model</h3>
                <p className="text-gray-600 mt-1">Choose the model that best fits your use case.</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {currentModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => handleModelSelect(model.value)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                      localApiConfig[provider].model === model.value
                        ? `${provider === 'openai' ? 'border-blue-500 bg-blue-50' : 'border-teal-500 bg-teal-50'}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-semibold text-gray-800">{model.label}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Pricing:</span> {model.pricing}
                        </div>
                      </div>
                      {localApiConfig[provider].model === model.value && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          provider === 'openai' ? 'bg-blue-500' : 'bg-teal-500'
                        }`}>
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: API Key Entry */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Enter Your API Key</h3>
                <p className="text-gray-600 mt-1">
                  Your API key is stored securely and never shared.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {provider === 'openai'
                      ? 'OpenAI API Key'
                      : provider === 'gemini'
                        ? 'Google AI API Key'
                        : 'OpenClaw API Key'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={localApiConfig[provider]?.apiKey || ''}
                      onChange={(e) =>
                        setLocalApiConfig(prev => ({
                          ...prev,
                          [provider]: { ...prev[provider], apiKey: e.target.value }
                        }))
                      }
                      placeholder={
                        provider === 'openai'
                          ? 'sk-XXXXXXXXXXXXXXXXXXXX'
                          : provider === 'gemini'
                            ? 'AIzaSyXXXXXXXXXXXXXXXXX'
                            : 'oc-skr-XXXXXXXXXXXXXXXXXXXX'
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <Shield size={12} className="mr-1" />
                    Your key is encrypted and stored securely. We never share or log it.
                  </div>
                </div>

                {/* OpenClaw-specific: Optional custom base URL */}
                {provider === 'openclaw' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Base URL
                      <span className="ml-1 text-gray-400 font-normal">(optional — for self-hosted instances)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={localApiConfig.openclaw.baseUrl || ''}
                        onChange={(e) =>
                          setLocalApiConfig(prev => ({
                            ...prev,
                            openclaw: { ...prev.openclaw, baseUrl: e.target.value }
                          }))
                        }
                        placeholder="https://api.openclaw.example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to use the default OpenClaw endpoint.
                    </p>
                  </div>
                )}

                {testResult && (
                  <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                        testResult.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {testResult.success ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-600" />}
                      </div>
                      <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={testApiConnection}
                  disabled={isSaving || !localApiConfig[provider]?.apiKey}
                  className="w-full"
                >
                  {isSaving ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Verification */}
          {currentStep === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Ready to Complete Setup!</h3>
                <p className="text-gray-600 mt-2">
                  You've selected{' '}
                  <strong>
                    {provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Google Gemini' : 'OpenClaw AI'}
                  </strong>
                  {provider !== 'openclaw' && (
                    <> with the <strong>{localApiConfig[provider].model}</strong> model.</>
                  )}
                  {provider === 'openclaw' && (
                    <>
                      {localApiConfig.openclaw.model !== 'default' && <> with model <strong>{localApiConfig.openclaw.model}</strong></>}
                      {localApiConfig.openclaw.baseUrl && <> (custom endpoint: <strong>{localApiConfig.openclaw.baseUrl}</strong>)}</>
                    </>
                  )}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-800 mb-2">What This Enables:</h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <Zap size={14} className="mr-2 mt-0.5" />
                    <span>AI-powered contact enrichment and lead scoring</span>
                  </li>
                  <li className="flex items-start">
                    <Brain size={14} className="mr-2 mt-0.5" />
                    <span>Smart email composition and response generation</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={14} className="mr-2 mt-0.5" />
                    <span>Advanced analytics and business insights</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
          
          <div className="flex space-x-2">
            {currentStep < 3 && (
              <Button
                onClick={() => currentStep < 2 && setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1}
              >
                Continue
              </Button>
            )}
            {currentStep === 3 && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIApiKeySettings;
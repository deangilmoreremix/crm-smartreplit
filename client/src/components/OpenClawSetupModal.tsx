import React from 'react';
import { X, ChevronRight, ChevronLeft, Check, Key, Brain, Zap, Users } from 'lucide-react';
import { useOpenClawSetup } from '../hooks/useOpenClawSetup';

interface OpenClawSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OpenClawSetupModal: React.FC<OpenClawSetupModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { state, actions } = useOpenClawSetup();

  if (!isOpen) return null;

  const handleNext = async () => {
    if (state.step === 'api-key') {
      const isValid = await actions.validateApiKey();
      if (isValid) {
        actions.nextStep();
      }
    } else if (state.step === 'demo') {
      const saved = await actions.saveApiKey();
      if (saved) {
        actions.nextStep();
      }
    } else {
      actions.nextStep();
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Setup OpenClaw AI</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlock AI-powered CRM features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            {['welcome', 'api-key', 'demo', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    ['welcome', 'api-key', 'demo', 'complete'].indexOf(state.step) >= index
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      ['welcome', 'api-key', 'demo', 'complete'].indexOf(state.step) > index
                        ? 'bg-purple-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Welcome</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">API Key</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Demo</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {state.step === 'welcome' && <WelcomeStep />}
          {state.step === 'api-key' && (
            <ApiKeyStep
              apiKey={state.apiKey}
              isValidating={state.isValidating}
              isValid={state.isValid}
              error={state.error}
              onApiKeyChange={actions.updateApiKey}
            />
          )}
          {state.step === 'demo' && <DemoStep />}
          {state.step === 'complete' && <CompleteStep onComplete={handleComplete} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={actions.prevStep}
            disabled={state.step === 'welcome'}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={state.step === 'api-key' && (!state.apiKey || state.isValidating)}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>
              {state.step === 'complete'
                ? 'Get Started'
                : state.step === 'demo'
                  ? 'Complete Setup'
                  : 'Continue'}
            </span>
            {state.step !== 'complete' && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Welcome to OpenClaw AI
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Transform your CRM with AI-powered insights and automation
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <Users className="w-6 h-6 text-purple-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Smart Contact Enrichment</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically enrich contacts with LinkedIn data, social profiles, and company insights
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">AI Deal Scoring</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get intelligent deal scoring with detailed rationale and win probability predictions
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <Brain className="w-6 h-6 text-green-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Natural Language Commands</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Control your entire CRM with conversational AI - "Create a deal for $50k" or "Schedule
            meeting tomorrow"
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <Key className="w-6 h-6 text-orange-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">Workflow Automation</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automate repetitive tasks and get AI-powered recommendations for next steps
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ApiKeyStep: React.FC<{
  apiKey: string;
  isValidating: boolean;
  isValid: boolean;
  error?: string;
  onApiKeyChange: (key: string) => void;
}> = ({ apiKey, isValidating, isValid, error, onApiKeyChange }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Enter Your OpenClaw API Key
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Get your API key from{' '}
        <a
          href="https://openclaw.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 underline"
        >
          openclaw.ai
        </a>
      </p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Enter your OpenClaw API key..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isValid && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600 dark:text-green-400">
              API key validated successfully!
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Need an API Key?</h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>
            1. Visit{' '}
            <a href="https://openclaw.ai" className="underline">
              openclaw.ai
            </a>
          </li>
          <li>2. Sign up for an account</li>
          <li>3. Navigate to API Keys section</li>
          <li>4. Generate a new API key</li>
          <li>5. Copy and paste it here</li>
        </ol>
      </div>
    </div>
  </div>
);

const DemoStep: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Try OpenClaw AI Features
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Experience the power of AI-driven CRM management
      </p>
    </div>

    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Commands:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 font-mono">→</span>
            <span className="text-gray-600 dark:text-gray-400">
              "Create a new contact for John Smith at Acme Corp"
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 font-mono">→</span>
            <span className="text-gray-600 dark:text-gray-400">
              "Schedule a meeting with Sarah tomorrow at 2pm"
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 font-mono">→</span>
            <span className="text-gray-600 dark:text-gray-400">
              "Show me deals over $100k in negotiation stage"
            </span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-purple-600 font-mono">→</span>
            <span className="text-gray-600 dark:text-gray-400">
              "Enrich contact data for john@acme.com"
            </span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          🎉 Setup Complete!
        </h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          Your OpenClaw API key has been configured successfully. You can now access all AI-powered
          CRM features.
        </p>
      </div>
    </div>
  </div>
);

const CompleteStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You're All Set!</h3>
      <p className="text-gray-600 dark:text-gray-400">
        OpenClaw AI is now ready to supercharge your CRM workflow
      </p>
    </div>

    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Quick Start Tips:</h4>
      <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
        <li>• Click the OpenClaw AI Chat in the navbar to start chatting</li>
        <li>• Try commands like "Show me my contacts" or "Create a new deal"</li>
        <li>• Use the Tools tab to browse and execute specific actions</li>
        <li>• Access the Help tab for command examples and tips</li>
      </ul>
    </div>

    <div className="text-center">
      <button
        onClick={onComplete}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Start Using OpenClaw AI
      </button>
    </div>
  </div>
);

export default OpenClawSetupModal;

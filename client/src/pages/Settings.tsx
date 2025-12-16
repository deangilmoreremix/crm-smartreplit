import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { useApiStore } from '../store/apiStore';
import { Eye, EyeOff, Key, AlertCircle, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

const Settings: React.FC = () => {
  const { apiKeys, setApiKey } = useApiStore();
  const { toast } = useToast();
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [openAiInput, setOpenAiInput] = useState(apiKeys.openai || '');
  const [geminiInput, setGeminiInput] = useState(apiKeys.google || '');

  const toggleOpenAiVisibility = () => setShowOpenAiKey(!showOpenAiKey);
  const toggleGeminiVisibility = () => setShowGeminiKey(!showGeminiKey);

  const handleOpenAiSave = () => {
    setApiKey('openai', openAiInput);
    toast({
      title: "Success",
      description: "OpenAI API key saved successfully!",
    });
  };

  const handleGeminiSave = () => {
    setApiKey('google', geminiInput);
    toast({
      title: "Success",
      description: "Gemini API key saved successfully!",
    });
  };

  const hasValidKeys = apiKeys.openai || apiKeys.google;

  return (
    <PageLayout
      title="Settings"
      description="Configure your AI CRM platform and API keys"
      actions={
        <Button onClick={() => {
          if (openAiInput) handleOpenAiSave();
          if (geminiInput) handleGeminiSave();
        }}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">

      {!hasValidKeys && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="text-amber-600 mr-3 mt-0.5" size={20} />
            <div>
              <h3 className="text-amber-800 font-medium mb-1">API Keys Required</h3>
              <p className="text-amber-700 text-sm">
                You need to add at least one API key (OpenAI or Gemini) to use the AI features in this application.
                Please add your API keys below to get started.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">API Configuration</h2>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Key size={18} className="mr-2 text-gray-500" />
            <h3 className="text-lg font-medium">OpenAI API Key</h3>
            <span className="ml-2 text-sm text-red-600 font-medium">Required for AI features</span>
          </div>
          <p className="text-gray-600 mb-4">
            Used for email drafting, sales forecasting, and business analysis. Get your API key from the{' '}
            <a 
              href="https://platform.openai.com/account/api-keys" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline"
            >
              OpenAI dashboard
            </a>.
          </p>
          
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showOpenAiKey ? 'text' : 'password'}
                value={openAiInput}
                onChange={(e) => setOpenAiInput(e.target.value)}
                placeholder="sk-..."
                className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={toggleOpenAiVisibility}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showOpenAiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleOpenAiSave}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!openAiInput.trim()}
            >
              Save
            </button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <Key size={18} className="mr-2 text-gray-500" />
            <h3 className="text-lg font-medium">Gemini API Key</h3>
            <span className="ml-2 text-sm text-gray-500 font-medium">Alternative to OpenAI</span>
          </div>
          <p className="text-gray-600 mb-4">
            Used for follow-up suggestions and task prioritization. Get your API key from the{' '}
            <a 
              href="https://makersuite.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>.
          </p>
          
          <div className="flex">
            <div className="relative flex-1">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                placeholder="AI..."
                className="w-full p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={toggleGeminiVisibility}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showGeminiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={handleGeminiSave}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!geminiInput.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <p className="text-gray-600">
          AI CRM Platform v0.1.0 - A powerful customer relationship management system enhanced with AI capabilities.
        </p>
        <p className="text-gray-600 mt-2">
          Built with React, Vite, and powered by OpenAI and Google Gemini.
        </p>
      </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
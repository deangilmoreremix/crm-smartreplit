import React, { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff, Key, AlertCircle, Save, Trash2, CheckCircle, XCircle, Loader2, Plus, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';

interface ApiKeyRecord {
  id: string;
  userId: string;
  provider: 'openai' | 'gemini';
  apiKey: string;
  apiKeyName: string | null;
  model: string | null;
  isDefault: boolean;
  isActive: boolean;
  lastTestedAt: string | null;
  testStatus: string | null;
  testError: string | null;
  createdAt: string;
  updatedAt: string;
}

const Settings: React.FC = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<'openai' | 'gemini'>('openai');
  const [newApiKey, setNewApiKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null);

  // Fetch keys from server
  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/user/api-keys', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch API keys');
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Add new API key
  const handleAddKey = async () => {
    if (!newApiKey.trim()) {
      toast({ title: 'Error', description: 'API key is required', variant: 'destructive' });
      return;
    }

    if (newProvider === 'openai' && !newApiKey.startsWith('sk-')) {
      toast({ title: 'Error', description: 'OpenAI API key must start with "sk-"', variant: 'destructive' });
      return;
    }

    if (newProvider === 'gemini' && !newApiKey.startsWith('AIza')) {
      toast({ title: 'Error', description: 'Gemini API key must start with "AIza"', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: newProvider,
          apiKey: newApiKey.trim(),
          apiKeyName: newKeyName.trim() || null,
          model: newModel.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add API key');
      }

      toast({ title: 'Success', description: `${newProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key added successfully` });
      setNewApiKey('');
      setNewKeyName('');
      setNewModel('');
      setShowAddForm(false);
      setShowNewKey(false);
      fetchKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Test an API key
  const handleTestKey = async (keyId: string) => {
    setTestingId(keyId);
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}/test`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        toast({ title: 'Success', description: 'API key is valid and working!' });
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'API key validation failed',
          variant: 'destructive',
        });
      }
      fetchKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to test API key', variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  };

  // Delete an API key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      toast({ title: 'Success', description: 'API key deleted' });
      fetchKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Set as default
  const handleSetDefault = async (keyId: string, provider: string) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) throw new Error('Failed to update API key');

      toast({ title: 'Success', description: 'Default API key updated' });
      fetchKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Toggle active status
  const handleToggleActive = async (keyId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) throw new Error('Failed to update API key');

      toast({ title: 'Success', description: `API key ${!currentActive ? 'activated' : 'deactivated'}` });
      fetchKeys();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openaiKeys = keys.filter((k) => k.provider === 'openai');
  const geminiKeys = keys.filter((k) => k.provider === 'gemini');
  const hasAnyKey = keys.length > 0;

  const getTestStatusIcon = (status: string | null) => {
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <PageLayout title="API Keys" description="Manage your AI API keys">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="API Keys"
      description="Add your OpenAI or Gemini API keys to power all AI features in the CRM"
      actions={
        <Button onClick={() => setShowAddForm(!showAddForm)} disabled={saving}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Warning if no keys */}
        {!hasAnyKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-amber-800 font-medium mb-1">API Keys Required</h3>
                <p className="text-amber-700 text-sm">
                  You need to add at least one API key (OpenAI or Gemini) to use AI features.
                  All AI functions — including contact enrichment, lead scoring, smart greetings,
                  KPI analysis, deal intelligence, and business intelligence — use your personal API keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add new key form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
            <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value as 'openai' | 'gemini')}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="openai">OpenAI (GPT-4o, GPT-4o-mini, etc.)</option>
                  <option value="gemini">Google Gemini (Gemini 1.5 Flash, etc.)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showNewKey ? 'text' : 'password'}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={newProvider === 'openai' ? 'sk-...' : 'AIza...'}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey(!showNewKey)}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showNewKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newProvider === 'openai' ? (
                    <>Get your key from <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">OpenAI dashboard</a></>
                  ) : (
                    <>Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Personal OpenAI Key"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Model (optional)</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder={newProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use the default model</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddKey} disabled={saving || !newApiKey.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save API Key
                </Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewApiKey(''); setNewKeyName(''); setNewModel(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OpenAI Keys */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Key size={18} className="mr-2 text-gray-500" />
            <h2 className="text-xl font-semibold">OpenAI API Keys</h2>
            <span className="ml-2 text-sm text-red-600 font-medium">Required for most AI features</span>
          </div>

          {openaiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">No OpenAI API keys added yet.</p>
          ) : (
            <div className="space-y-3">
              {openaiKeys.map((key) => (
                <div key={key.id} className={`border rounded-lg p-4 ${key.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">
                        {key.apiKeyName || 'OpenAI Key'}
                        {key.isDefault && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                        {!key.isActive && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      {getTestStatusIcon(key.testStatus)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">{key.apiKey}</span>
                    </div>
                  </div>

                  {key.model && (
                    <p className="text-xs text-gray-500 mt-1">Model: {key.model}</p>
                  )}

                  {key.testError && (
                    <p className="text-xs text-red-500 mt-1">Error: {key.testError}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestKey(key.id)}
                      disabled={testingId === key.id}
                    >
                      {testingId === key.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Test
                    </Button>
                    {!key.isDefault && (
                      <Button size="sm" variant="outline" onClick={() => handleSetDefault(key.id, 'openai')}>
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(key.id, key.isActive)}>
                      {key.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteKey(key.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gemini Keys */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Key size={18} className="mr-2 text-gray-500" />
            <h2 className="text-xl font-semibold">Google Gemini API Keys</h2>
            <span className="ml-2 text-sm text-gray-500 font-medium">Alternative AI provider</span>
          </div>

          {geminiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">No Gemini API keys added yet.</p>
          ) : (
            <div className="space-y-3">
              {geminiKeys.map((key) => (
                <div key={key.id} className={`border rounded-lg p-4 ${key.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">
                        {key.apiKeyName || 'Gemini Key'}
                        {key.isDefault && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                        {!key.isActive && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      {getTestStatusIcon(key.testStatus)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">{key.apiKey}</span>
                    </div>
                  </div>

                  {key.model && (
                    <p className="text-xs text-gray-500 mt-1">Model: {key.model}</p>
                  )}

                  {key.testError && (
                    <p className="text-xs text-red-500 mt-1">Error: {key.testError}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestKey(key.id)}
                      disabled={testingId === key.id}
                    >
                      {testingId === key.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      Test
                    </Button>
                    {!key.isDefault && (
                      <Button size="sm" variant="outline" onClick={() => handleSetDefault(key.id, 'gemini')}>
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(key.id, key.isActive)}>
                      {key.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteKey(key.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <SettingsIcon className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-blue-800 font-medium mb-1">How It Works</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• All AI features use <strong>your own API keys</strong> — we never provide unlimited AI</li>
                <li>• You can add either OpenAI or Gemini keys (or both)</li>
                <li>• Only one key per provider can be the default — the default is used for all AI requests</li>
                <li>• Your keys are stored securely and never shared with other users</li>
                <li>• You're billed directly by OpenAI/Google for your usage</li>
                <li>• Use the "Test" button to verify your key works before using AI features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;

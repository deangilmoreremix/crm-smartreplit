import React, { useState } from 'react';
import { Bot, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIApiKeys } from '../hooks/useAIApiKeys';
import AIApiKeySettings from './aiIntegration/AIApiKeySettings';

interface AIProviderSettingsProps {
  className?: string;
}

/**
 * AI provider status for Admin Settings. API keys are stored on the server (user_api_keys, via
 * /api/user/api-keys) and never in the browser; this shows only whether a key exists and opens the
 * server-backed key dialog.
 */
const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ className }) => {
  const { apiConfig, isLoading, error } = useAIApiKeys();
  const [open, setOpen] = useState(false);
  const providers = [
    { id: 'openai', name: 'OpenAI', configured: Boolean(apiConfig.openai.apiKey) },
    { id: 'openclaw', name: 'OpenClaw', configured: Boolean(apiConfig.openclaw.apiKey) },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Provider Settings
        </CardTitle>
        <CardDescription>
          Your API keys are stored securely on the server. AI features use your own OpenAI key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <ul className="space-y-2">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between" data-testid={`provider-${p.id}`}>
              <span className="font-medium">{p.name}</span>
              {isLoading ? (
                <span className="text-sm text-gray-500">Checking...</span>
              ) : p.configured ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Key saved
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No key
                </Badge>
              )}
            </li>
          ))}
        </ul>
        <Button onClick={() => setOpen(true)}>
          <Key className="h-4 w-4 mr-2" />
          Manage API keys
        </Button>
        <AIApiKeySettings open={open} onOpenChange={setOpen} />
      </CardContent>
    </Card>
  );
};

export default AIProviderSettings;

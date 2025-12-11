import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Settings, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface APIStatus {
  configured: boolean;
  model: string;
  status: string;
  gpt5Available?: boolean;
  capabilities?: string[];
  error?: string;
  suggestion?: string;
}

export function APIKeyStatus() {
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-accent/20 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-accent/10 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-400';
      case 'api_key_invalid': return 'text-red-400';
      case 'needs_configuration': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'api_key_invalid': return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'needs_configuration': return <Settings className="h-5 w-5 text-yellow-400" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white/90 flex items-center justify-between">
          OpenAI API Status
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white/60 hover:text-white/90"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiStatus && (
          <>
            <div className="flex items-center gap-3">
              {getStatusIcon(apiStatus.status)}
              <div>
                <div className={`font-medium ${getStatusColor(apiStatus.status)}`}>
                  {apiStatus.status === 'ready' ? 'Connected' : 
                   apiStatus.status === 'api_key_invalid' ? 'Invalid API Key' :
                   apiStatus.status === 'needs_configuration' ? 'Not Configured' : 
                   'Unknown Status'}
                </div>
                <div className="text-sm text-white/60">
                  Model: {apiStatus.model}
                </div>
              </div>
            </div>

            {apiStatus.gpt5Available !== undefined && (
              <div className="flex items-center gap-2">
                <Badge variant={apiStatus.gpt5Available ? 'default' : 'secondary'}>
                  GPT-5 {apiStatus.gpt5Available ? 'Available' : 'Not Available'}
                </Badge>
                {!apiStatus.gpt5Available && apiStatus.status === 'ready' && (
                  <Badge variant="outline">Using GPT-4 Fallback</Badge>
                )}
              </div>
            )}

            {apiStatus.capabilities && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/80">Capabilities:</h4>
                <div className="grid grid-cols-1 gap-1 text-xs text-white/60">
                  {apiStatus.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-accent rounded-full"></div>
                      {capability}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {apiStatus.error && (
              <Alert className="border-red-400/20 bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {apiStatus.error}
                  {apiStatus.suggestion && (
                    <>
                      <br />
                      <span className="text-red-300 text-sm">{apiStatus.suggestion}</span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {apiStatus.status !== 'ready' && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open('https://platform.openai.com/account/api-keys', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  OpenAI API Keys
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
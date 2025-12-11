import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AIAutomationDashboard from '../components/AIAutomationDashboard';
import { 
  Bot, 
  Brain, 
  Zap, 
  Settings,
  Database,
  Globe,
  Shield,
  Activity,
  Plus
} from 'lucide-react';

export default function AIIntegration() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const integrationCategories = [
    {
      name: 'AI Models & APIs',
      icon: Brain,
      description: 'Connect external AI services and models',
      integrations: [
        { name: 'OpenAI GPT-4', status: 'connected', type: 'text-generation' },
        { name: 'Anthropic Claude', status: 'available', type: 'text-generation' },
        { name: 'Google Bard', status: 'available', type: 'text-generation' },
        { name: 'Stability AI', status: 'available', type: 'image-generation' },
        { name: 'Whisper API', status: 'available', type: 'speech-to-text' },
      ]
    },
    {
      name: 'CRM Integrations',
      icon: Database,
      description: 'Sync with external CRM systems',
      integrations: [
        { name: 'Salesforce', status: 'connected', type: 'crm' },
        { name: 'HubSpot', status: 'available', type: 'crm' },
        { name: 'Pipedrive', status: 'available', type: 'crm' },
        { name: 'Zoho CRM', status: 'available', type: 'crm' },
        { name: 'Microsoft Dynamics', status: 'available', type: 'crm' },
      ]
    },
    {
      name: 'Communication Tools',
      icon: Globe,
      description: 'Email, SMS, and messaging platforms',
      integrations: [
        { name: 'Gmail API', status: 'connected', type: 'email' },
        { name: 'Outlook 365', status: 'available', type: 'email' },
        { name: 'Twilio SMS', status: 'connected', type: 'sms' },
        { name: 'Slack', status: 'available', type: 'messaging' },
        { name: 'Microsoft Teams', status: 'available', type: 'messaging' },
      ]
    },
    {
      name: 'Data Enrichment',
      icon: Zap,
      description: 'Contact and company data enrichment',
      integrations: [
        { name: 'Clearbit', status: 'connected', type: 'enrichment' },
        { name: 'ZoomInfo', status: 'available', type: 'enrichment' },
        { name: 'Apollo.io', status: 'available', type: 'enrichment' },
        { name: 'Hunter.io', status: 'available', type: 'enrichment' },
        { name: 'LinkedIn Sales Navigator', status: 'available', type: 'enrichment' },
      ]
    },
    {
      name: 'Analytics & BI',
      icon: Activity,
      description: 'Business intelligence and analytics',
      integrations: [
        { name: 'Google Analytics', status: 'available', type: 'analytics' },
        { name: 'Mixpanel', status: 'available', type: 'analytics' },
        { name: 'Tableau', status: 'available', type: 'bi' },
        { name: 'Power BI', status: 'available', type: 'bi' },
        { name: 'Looker', status: 'available', type: 'bi' },
      ]
    },
    {
      name: 'Security & Compliance',
      icon: Shield,
      description: 'Security and compliance tools',
      integrations: [
        { name: 'Auth0', status: 'connected', type: 'auth' },
        { name: 'Okta', status: 'available', type: 'auth' },
        { name: 'Azure AD', status: 'available', type: 'auth' },
        { name: 'GDPR Compliance', status: 'enabled', type: 'compliance' },
        { name: 'SOC 2 Monitoring', status: 'enabled', type: 'compliance' },
      ]
    }
  ];

  const IntegrationsTab = () => (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrationCategories.reduce((sum, cat) => 
                sum + cat.integrations.filter(i => i.status === 'connected').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrationCategories.reduce((sum, cat) => 
                sum + cat.integrations.filter(i => i.status === 'available').length, 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to connect
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationCategories.length}</div>
            <p className="text-xs text-muted-foreground">
              Integration types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrationCategories.reduce((sum, cat) => sum + cat.integrations.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All integrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Categories */}
      <div className="space-y-6">
        {integrationCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card key={category.name}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.integrations.map((integration) => (
                    <div 
                      key={integration.name} 
                      className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-blue-300 ${
                        selectedIntegration === integration.name ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedIntegration(
                        selectedIntegration === integration.name ? null : integration.name
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{integration.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          integration.status === 'connected' 
                            ? 'bg-green-100 text-green-800' 
                            : integration.status === 'enabled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.status}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 capitalize mb-3">
                        {integration.type.replace('-', ' ')}
                      </p>
                      <Button 
                        size="sm" 
                        variant={integration.status === 'connected' ? 'outline' : 'default'}
                        className="w-full"
                      >
                        {integration.status === 'connected' ? 'Configure' : 
                         integration.status === 'enabled' ? 'Manage' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary AI Model</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>GPT-4 (OpenAI)</option>
                  <option>Claude-3 (Anthropic)</option>
                  <option>Gemini Pro (Google)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fallback Model</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>GPT-3.5 Turbo</option>
                  <option>Claude-2</option>
                  <option>PaLM 2</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">AI Response Temperature</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                defaultValue="0.7"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Auto-generate insights', description: 'Automatically generate AI insights from data', enabled: true },
              { name: 'Smart suggestions', description: 'Show AI-powered action suggestions', enabled: true },
              { name: 'Auto-enrichment', description: 'Automatically enrich contact data', enabled: false },
              { name: 'Workflow automation', description: 'Enable automated workflow execution', enabled: true },
              { name: 'Email automation', description: 'AI-powered email responses and follow-ups', enabled: false },
            ].map((setting) => (
              <div key={setting.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{setting.name}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={setting.enabled}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys & Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { service: 'OpenAI API', status: 'configured', lastUsed: '2 minutes ago' },
              { service: 'Anthropic API', status: 'not_configured', lastUsed: 'Never' },
              { service: 'Google AI API', status: 'not_configured', lastUsed: 'Never' },
              { service: 'Clearbit API', status: 'configured', lastUsed: '1 hour ago' },
              { service: 'Twilio API', status: 'configured', lastUsed: '5 minutes ago' },
            ].map((api) => (
              <div key={api.service} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{api.service}</h4>
                  <p className="text-sm text-gray-600">Last used: {api.lastUsed}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    api.status === 'configured' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {api.status === 'configured' ? 'Configured' : 'Not Configured'}
                  </div>
                  <Button size="sm" variant="outline">
                    {api.status === 'configured' ? 'Update' : 'Configure'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage & Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-lg">$127.45</h4>
              <p className="text-sm text-gray-600">This month's spend</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-lg">15,234</h4>
              <p className="text-sm text-gray-600">API calls made</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium text-lg">2.1M</h4>
              <p className="text-sm text-gray-600">Tokens used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Integration & Automation</h1>
            <p className="text-gray-600">Manage AI integrations, automation rules, and workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value="automation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Automation
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automation">
            <AIAutomationDashboard />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

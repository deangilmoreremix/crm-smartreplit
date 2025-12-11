import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { useAIIntegrationStore } from '../store/aiIntegrationStore';
import { 
  Bot, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Play,
  Pause,
  Trash2,
  Edit,
  Plus,
  Settings,
  Brain,
  Lightbulb,
  Target,
  BarChart3,
  Activity,
  Workflow
} from 'lucide-react';

export default function AIAutomationDashboard() {
  const {
    automationRules,
    insights,
    workflows,
    suggestions,
    models,
    loading,
    newInsights,
    pendingSuggestions,
    createAutomationRule,
    toggleAutomationRule,
    executeAutomationRule,
    generateInsights,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    dismissInsight,
    actOnInsight,
    getAutomationAnalytics,
    getWorkflowAnalytics
  } = useAIIntegrationStore();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  useEffect(() => {
    // Generate initial insights and suggestions
    generateInsights();
    generateSuggestions({ entityType: 'contact', entityId: 'sample' });
  }, [generateInsights, generateSuggestions]);

  const automationAnalytics = getAutomationAnalytics();
  const workflowAnalytics = getWorkflowAnalytics();

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationAnalytics.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              of {automationAnalytics.totalRules} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automationAnalytics.executionsToday}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(automationAnalytics.successRate)} success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newInsights}</div>
            <p className="text-xs text-muted-foreground">
              {insights.length} total insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Suggestions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} total suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => generateInsights()}
              disabled={loading.insights}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {loading.insights ? 'Generating...' : 'Generate AI Insights'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => createAutomationRule({
                name: 'New Rule',
                description: 'Automation rule description',
                trigger: { type: 'email_received', config: {} },
                conditions: [],
                actions: [],
                isActive: false,
                createdBy: 'current_user',
                priority: 'medium',
                tags: []
              })}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Automation Rule
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Workflow className="w-4 h-4" />
              Build AI Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant={
                        insight.impact === 'critical' ? 'destructive' :
                        insight.impact === 'high' ? 'default' :
                        'secondary'
                      }>
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {formatPercent(insight.confidence)} confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {insight.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => actOnInsight(insight.id, 'accept')}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissInsight(insight.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Lightbulb className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No insights available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.filter(s => s.status === 'pending').slice(0, 3).map((suggestion) => (
                <div key={suggestion.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {suggestion.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {formatPercent(suggestion.confidence)} confidence
                    </Badge>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => acceptSuggestion(suggestion.id)}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissSuggestion(suggestion.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {suggestions.filter(s => s.status === 'pending').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Target className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No pending suggestions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AutomationRulesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Automation Rules</h3>
          <p className="text-sm text-gray-600">Manage your automated workflows and triggers</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {automationRules.map((rule) => (
          <Card key={rule.id} className={`transition-all ${selectedRule === rule.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={rule.isActive}
                    onCheckedChange={() => toggleAutomationRule(rule.id)}
                  />
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className={
                    rule.priority === 'critical' ? 'border-red-500 text-red-700' :
                    rule.priority === 'high' ? 'border-orange-500 text-orange-700' :
                    rule.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                    'border-gray-500 text-gray-700'
                  }>
                    {rule.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Trigger</p>
                  <p className="text-sm font-medium capitalize">
                    {rule.trigger.type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Executions</p>
                  <p className="text-sm font-medium">{rule.executionCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Success Rate</p>
                  <p className="text-sm font-medium">{formatPercent(rule.successRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Executed</p>
                  <p className="text-sm font-medium">
                    {rule.lastExecuted ? 
                      new Date(rule.lastExecuted).toLocaleDateString() : 
                      'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => executeAutomationRule(rule.id)}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Test Run
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Configure
                </Button>
              </div>

              {rule.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {rule.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {automationRules.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-500">No automation rules created yet</p>
              <Button className="mt-4">Create Your First Rule</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const InsightsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <p className="text-sm text-gray-600">AI-powered recommendations and analysis</p>
        </div>
        <Button 
          onClick={() => generateInsights()}
          disabled={loading.insights}
          className="flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          {loading.insights ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      {/* Insights Categories */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['opportunity', 'risk', 'prediction', 'recommendation'].map((type) => {
          const count = insights.filter(i => i.type === type).length;
          return (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{type}s</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    type === 'opportunity' ? 'bg-green-100' :
                    type === 'risk' ? 'bg-red-100' :
                    type === 'prediction' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {type === 'opportunity' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {type === 'risk' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {type === 'prediction' && <BarChart3 className="w-4 h-4 text-blue-600" />}
                    {type === 'recommendation' && <Lightbulb className="w-4 h-4 text-purple-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={
                      insight.impact === 'critical' ? 'destructive' :
                      insight.impact === 'high' ? 'default' :
                      'secondary'
                    }>
                      {insight.impact} impact
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Confidence: {formatPercent(insight.confidence)}</span>
                    <span>Category: {insight.category.replace('_', ' ')}</span>
                    <span>Created: {new Date(insight.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="outline" className={
                  insight.status === 'new' ? 'border-blue-500 text-blue-700' :
                  insight.status === 'reviewing' ? 'border-orange-500 text-orange-700' :
                  insight.status === 'acted_upon' ? 'border-green-500 text-green-700' :
                  'border-gray-500 text-gray-700'
                }>
                  {insight.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {insight.data.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">Recommendations:</h5>
                  <ul className="space-y-1">
                    {insight.data.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insight.relatedEntities.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-sm mb-2">Related:</h5>
                  <div className="flex flex-wrap gap-2">
                    {insight.relatedEntities.map((entity) => (
                      <Badge key={`${entity.type}-${entity.id}`} variant="outline" className="text-xs">
                        {entity.type}: {entity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => actOnInsight(insight.id, 'accept')}
                  disabled={insight.status !== 'new'}
                >
                  Act on This
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => dismissInsight(insight.id)}
                  disabled={insight.status !== 'new'}
                >
                  Dismiss
                </Button>
                <Button size="sm" variant="ghost">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {insights.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-gray-500">No insights available</p>
              <Button 
                onClick={() => generateInsights()}
                disabled={loading.insights}
                className="mt-4"
              >
                Generate AI Insights
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const WorkflowsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Workflows</h3>
          <p className="text-sm text-gray-600">Visual workflow builder and execution</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      {/* Workflow Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Workflows</p>
                <p className="text-2xl font-bold">{workflowAnalytics.totalWorkflows}</p>
              </div>
              <Workflow className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Workflows</p>
                <p className="text-2xl font-bold">{workflowAnalytics.activeWorkflows}</p>
              </div>
              <Activity className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Executions This Week</p>
                <p className="text-2xl font-bold">{workflowAnalytics.executionsThisWeek}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Avg Duration</p>
                <p className="text-2xl font-bold">{(workflowAnalytics.averageDuration / 1000).toFixed(1)}s</p>
              </div>
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Workflows */}
      <Card>
        <CardContent className="text-center py-12">
          <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Visual Workflow Builder</h3>
          <p className="text-gray-600 mb-4">
            Create sophisticated AI-powered workflows with drag-and-drop interface
          </p>
          <Button>Launch Workflow Builder</Button>
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
            <h1 className="text-3xl font-bold text-gray-900">AI Automation & Integration</h1>
            <p className="text-gray-600">Intelligent automation and AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {automationAnalytics.activeRules} active rules
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {newInsights} new insights
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Automation Rules
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationRulesTab />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsTab />
          </TabsContent>

          <TabsContent value="workflows">
            <WorkflowsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

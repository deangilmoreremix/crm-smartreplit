import React, { useState, useEffect } from 'react';
import { agentOrchestrator } from '@smartcrm/ai-agents';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Bot,
  Users,
  Mail,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Settings,
} from 'lucide-react';

interface Agent {
  name: string;
  status: 'active' | 'inactive' | 'processing';
  description: string;
  icon: React.ReactNode;
  lastActivity?: string;
  tasksCompleted?: number;
}

const AIAgentsManagement: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    {
      name: 'Lead Qualification Agent',
      status: 'active',
      description: 'Automatically scores and qualifies incoming leads',
      icon: <Users className="w-5 h-5" />,
      lastActivity: '2 minutes ago',
      tasksCompleted: 45,
    },
    {
      name: 'Email Intelligence Agent',
      status: 'active',
      description: 'Analyzes email sentiment and drafts responses',
      icon: <Mail className="w-5 h-5" />,
      lastActivity: '5 minutes ago',
      tasksCompleted: 23,
    },
    {
      name: 'Sales Pipeline Agent',
      status: 'processing',
      description: 'Monitors deal health and predicts close probability',
      icon: <TrendingUp className="w-5 h-5" />,
      lastActivity: '1 minute ago',
      tasksCompleted: 67,
    },
    {
      name: 'Customer Success Agent',
      status: 'active',
      description: 'Tracks customer health and prevents churn',
      icon: <BarChart3 className="w-5 h-5" />,
      lastActivity: '10 minutes ago',
      tasksCompleted: 12,
    },
    {
      name: 'Meeting Scheduler Agent',
      status: 'active',
      description: 'Smart calendar management and meeting coordination',
      icon: <Calendar className="w-5 h-5" />,
      lastActivity: '15 minutes ago',
      tasksCompleted: 8,
    },
    {
      name: 'Analytics Agent',
      status: 'active',
      description: 'Generates insights and performance reports',
      icon: <BarChart3 className="w-5 h-5" />,
      lastActivity: '30 minutes ago',
      tasksCompleted: 156,
    },
  ]);

  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const loadAgentStatus = async () => {
    setIsLoading(true);
    try {
      const health = await agentOrchestrator.getAgentHealth();
      setSystemHealth(health);

      // Update agent statuses based on real data
      if (health?.agents) {
        setAgents((prev) =>
          prev.map((agent) => ({
            ...agent,
            status:
              health.agents[agent.name.toLowerCase().replace(' agent', '').replace(' ', '_')] ===
              'active'
                ? 'active'
                : 'inactive',
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load agent status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAgent = async (agentName: string) => {
    // In a real implementation, this would call an API to enable/disable agents
    setAgents((prev) =>
      prev.map((agent) =>
        agent.name === agentName
          ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' }
          : agent
      )
    );
  };

  const runWorkflow = async (workflowType: 'daily' | 'weekly') => {
    setIsLoading(true);
    try {
      if (workflowType === 'daily') {
        await agentOrchestrator.runDailyWorkflows();
      } else {
        await agentOrchestrator.runWeeklyWorkflows();
      }
      // Show success message
    } catch (error) {
      console.error(`Failed to run ${workflowType} workflow:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bot className="w-6 h-6 mr-2 text-purple-600" />
            AI Agents Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and control your autonomous AI agents
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => runWorkflow('daily')}
            disabled={isLoading}
            variant="outline"
            className="flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Daily Workflow
          </Button>
          <Button
            onClick={() => runWorkflow('weekly')}
            disabled={isLoading}
            variant="outline"
            className="flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Run Weekly Workflow
          </Button>
          <Button
            onClick={loadAgentStatus}
            disabled={isLoading}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemHealth.api === 'healthy' ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">API Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {systemHealth.database === 'connected' ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Database</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {
                    Object.values(systemHealth.agents || {}).filter((s: any) => s === 'active')
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    {agent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </div>
                </div>
                <Button
                  onClick={() => toggleAgent(agent.name)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  {agent.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{agent.description}</p>
              <div className="space-y-2 text-xs text-gray-500">
                {agent.lastActivity && <div>Last activity: {agent.lastActivity}</div>}
                {agent.tasksCompleted !== undefined && (
                  <div>Tasks completed: {agent.tasksCompleted}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.filter((a) => a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {agents.filter((a) => a.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {agents.reduce((sum, agent) => sum + (agent.tasksCompleted || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentsManagement;

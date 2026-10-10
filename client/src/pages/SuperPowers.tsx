import React, { useState, useEffect } from 'react';
import {
  Bot,
  Users,
  Mail,
  TrendingUp,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Settings,
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Linkedin,
  FileText,
  Phone,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface AgentStatus {
  name: string;
  status: 'active' | 'inactive' | 'processing';
  icon: React.ReactNode;
  lastActivity?: string;
  tasksCompleted?: number;
}

interface OutreachLead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: 'new' | 'qualified' | 'outreach' | 'replied' | 'converted';
  score?: number;
}

interface GTMTemplate {
  id: string;
  title: string;
  category: string;
  useCase: string;
}

const SuperPowersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      name: 'Lead Qualification Agent',
      status: 'active',
      icon: <Target className="w-5 h-5" />,
      lastActivity: '2 min ago',
      tasksCompleted: 45,
    },
    {
      name: 'Email Intelligence Agent',
      status: 'active',
      icon: <Mail className="w-5 h-5" />,
      lastActivity: '5 min ago',
      tasksCompleted: 23,
    },
    {
      name: 'Sales Pipeline Agent',
      status: 'processing',
      icon: <TrendingUp className="w-5 h-5" />,
      lastActivity: '1 min ago',
      tasksCompleted: 67,
    },
    {
      name: 'Customer Success Agent',
      status: 'active',
      icon: <Users className="w-5 h-5" />,
      lastActivity: '10 min ago',
      tasksCompleted: 12,
    },
    {
      name: 'Meeting Scheduler Agent',
      status: 'active',
      icon: <Calendar className="w-5 h-5" />,
      lastActivity: '15 min ago',
      tasksCompleted: 8,
    },
    {
      name: 'Analytics Agent',
      status: 'active',
      icon: <BarChart3 className="w-5 h-5" />,
      lastActivity: '30 min ago',
      tasksCompleted: 156,
    },
  ]);

  const [outreachLeads, setOutreachLeads] = useState<OutreachLead[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'Acme Corp',
      email: 'sarah@acme.com',
      status: 'qualified',
      score: 85,
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'TechStart',
      email: 'michael@techstart.io',
      status: 'outreach',
      score: 72,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      company: 'Global Solutions',
      email: 'emily@globalsol.com',
      status: 'replied',
      score: 91,
    },
    {
      id: '4',
      name: 'David Park',
      company: 'InnovateTech',
      email: 'david@innovatetech.com',
      status: 'new',
      score: 45,
    },
  ]);

  const [gtmTemplates] = useState<GTMTemplate[]>([
    {
      id: '1',
      title: 'Cold Email - SDR',
      category: 'Email',
      useCase: 'Initial outreach to cold prospects',
    },
    {
      id: '2',
      title: 'Discovery Call Prep',
      category: 'Discovery',
      useCase: 'Prepare for discovery calls using SPIN',
    },
    {
      id: '3',
      title: 'Competitive Battle Card',
      category: 'Competitive',
      useCase: 'Win against specific competitors',
    },
    {
      id: '4',
      title: 'Follow-up Sequence',
      category: 'Follow-up',
      useCase: 'Multi-touch follow-up sequences',
    },
    {
      id: '5',
      title: 'MEDDPICC Qualification',
      category: 'Methodology',
      useCase: 'Enterprise deal qualification',
    },
    {
      id: '6',
      title: 'Value Proposition',
      category: 'Positioning',
      useCase: 'Build compelling value props',
    },
  ]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
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

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'outreach':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-purple-100 text-purple-800';
      case 'converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'new':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              SuperPowers Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI Agents & Sales Automation from 5 Integrated Repositories
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Repository Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">OpenClaw</p>
                  <p className="text-2xl font-bold">Connected</p>
                </div>
                <Bot className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">AI Agents</p>
                  <p className="text-2xl font-bold">6 Active</p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">DenchClaw</p>
                  <p className="text-2xl font-bold">Local</p>
                </div>
                <Settings className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Sales Outreach</p>
                  <p className="text-2xl font-bold">4 Leads</p>
                </div>
                <Target className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">GTM Skills</p>
                  <p className="text-2xl font-bold">2500+</p>
                </div>
                <Zap className="w-10 h-10 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="outreach">Sales Outreach</TabsTrigger>
            <TabsTrigger value="templates">GTM Templates</TabsTrigger>
            <TabsTrigger value="denchclaw">DenchClaw</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-600" />
                    AI Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.name}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-green-100' : agent.status === 'processing' ? 'bg-yellow-100' : 'bg-gray-100'}`}
                          >
                            {agent.icon}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-xs text-gray-500">{agent.lastActivity}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Lead Qualified: Sarah Johnson</p>
                        <p className="text-sm text-gray-500">AI Agent scored lead at 85%</p>
                        <p className="text-xs text-gray-400">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Email Sent: Emily Rodriguez</p>
                        <p className="text-sm text-gray-500">Personalized outreach email sent</p>
                        <p className="text-xs text-gray-400">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Meeting Scheduled</p>
                        <p className="text-sm text-gray-500">Discovery call for Acme Corp</p>
                        <p className="text-xs text-gray-400">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Deal Updated: TechStart</p>
                        <p className="text-sm text-gray-500">Pipeline stage changed to Proposal</p>
                        <p className="text-xs text-gray-400">30 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-600" />
                    AI Agents Management
                  </div>
                  <Button size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Run Daily Workflow
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-green-100' : agent.status === 'processing' ? 'bg-yellow-100' : 'bg-gray-100'}`}
                          >
                            {React.cloneElement(agent.icon as React.ReactElement, {
                              className: 'w-5 h-5',
                            })}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <Badge className={`mt-1 ${getStatusColor(agent.status)}`}>
                              {agent.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Tasks: {agent.tasksCompleted}</p>
                        <p>Last: {agent.lastActivity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-orange-600" />
                    Sales Outreach Pipeline
                  </div>
                  <Button size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Run Full Automation
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outreachLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {lead.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-gray-500">
                            {lead.company} • {lead.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {lead.score && (
                          <div className="text-right">
                            <p className="text-sm font-medium">{lead.score}%</p>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                        )}
                        <Badge className={getLeadStatusColor(lead.status)}>{lead.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-pink-600" />
                  GTM Skills Templates (2,500+)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gtmTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="font-medium mb-1">{template.title}</p>
                      <p className="text-sm text-gray-500">{template.useCase}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline">Browse All 2,500+ Templates</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DenchClaw Tab */}
          <TabsContent value="denchclaw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-green-600" />
                  DenchClaw - Local OpenClaw Framework
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="font-medium text-green-700 dark:text-green-400">
                        Gateway Status: Running
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 ml-7">
                      Profile: dench | Port: 19001 | Web UI: localhost:3100
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">Workspace Objects</p>
                      <div className="text-sm text-gray-500">
                        <p>Contacts: 156</p>
                        <p>Deals: 42</p>
                        <p>Activities: 1,234</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">Skills Installed</p>
                      <div className="text-sm text-gray-500">
                        <p>CRM Automation: Active</p>
                        <p>Outreach Agents: Active</p>
                        <p>Custom Skills: 5</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                      Open DenchClaw UI
                    </Button>
                    <Button variant="outline" size="sm">
                      Restart Gateway
                    </Button>
                    <Button variant="outline" size="sm">
                      Sync Workspace
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperPowersPage;

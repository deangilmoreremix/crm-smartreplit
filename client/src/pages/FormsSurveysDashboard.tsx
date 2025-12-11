import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import CommunicationDashboard from '../components/CommunicationDashboard';
import GlassCard from '../components/GlassCard';
import { gpt5Communication } from '../services/gpt5CommunicationService';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  CheckCircle,
  Users,
  Calendar,
  Target,
  Zap,
  Activity,
  TrendingUp,
  Copy,
  Download,
  Share
} from 'lucide-react';

interface Form {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  responses: number;
  completionRate: number;
  createdDate: string;
  lastModified: string;
  fields: FormField[];
  gpt5Optimization?: {
    suggestedFields: string[];
    predictedCompletionRate: number;
    engagementScore: number;
  };
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'rating';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface SurveyStats {
  totalForms: number;
  activeForms: number;
  totalResponses: number;
  averageCompletionRate: number;
  monthlyGrowth: number;
  aiOptimizationScore: number;
}

export default function FormsSurveysDashboard() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('forms');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formPurpose, setFormPurpose] = useState('feedback');
  const [formLength, setFormLength] = useState('short');
  const [requiredFields, setRequiredFields] = useState('minimal');
  const [defaultTheme, setDefaultTheme] = useState('modern');
  const [responseStorage, setResponseStorage] = useState('database');
  const [aiOptimization, setAiOptimization] = useState('enabled');
  const [autoSave, setAutoSave] = useState('enabled');

  const { data: forms = [], isLoading: formsLoading } = useQuery<Form[]>({
    queryKey: ['/api/forms'],
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<SurveyStats>({
    queryKey: ['/api/forms/stats'],
    refetchInterval: 30000,
  });

  const optimizeForm = async (form: Form) => {
    setIsOptimizing(true);
    try {
      const result = await gpt5Communication.optimizeContent(
        `Form: ${form.title}, Description: ${form.description}, Fields: ${form.fields.map(f => f.label).join(', ')}`,
        'form-optimization'
      );
      console.log('Form optimization:', result);
    } catch (error) {
      console.error('Failed to optimize form:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const actionButtons = [
    <Button
      key="create-form"
      onClick={() => setShowCreateModal(true)}
      className="bg-green-600 hover:bg-green-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Form
    </Button>,
    <Button
      key="ai-optimize"
      variant="outline"
      onClick={() => forms.length > 0 && optimizeForm(forms[0])}
      disabled={isOptimizing || forms.length === 0}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isOptimizing ? 'Optimizing...' : 'AI Form Optimizer'}
    </Button>
  ];

  const headerStats = stats ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalForms}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Forms</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.activeForms}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Forms</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{stats.totalResponses}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Total Responses</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageCompletionRate * 100)}%</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Avg Completion</div>
      </div>
    </div>
  ) : null;

  const filteredForms = forms.filter(form => {
    if (searchQuery && !form.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !form.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && form.status !== filterStatus) return false;
    return true;
  });

  return (
    <CommunicationDashboard
      appName="Intelligent Form Builder"
      appDescription="AI-powered form creation with smart field suggestions, completion rate optimization, and advanced analytics"
      actionButtons={actionButtons}
      headerStats={headerStats}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-6">
          {/* Search and Filters */}
          <GlassCard className="p-4">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Input
                    placeholder="Search forms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Forms List */}
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Forms ({filteredForms.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                {filteredForms.map(form => (
                  <GlassCard
                    key={form.id}
                    className="p-4 cursor-pointer hover:border-blue-300"
                    onClick={() => setSelectedForm(form)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          form.status === 'published' ? 'bg-green-100' :
                          form.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{form.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{form.description}</div>
                          <div className="text-xs text-gray-500">
                            {form.responses} responses • {Math.round(form.completionRate * 100)}% completion
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(form.status)}>
                          {form.status}
                        </Badge>
                        <div className="flex gap-1 ml-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {form.gpt5Optimization && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span className="text-xs text-purple-600">AI</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Form Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-blue-50">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Customer Feedback</h3>
                    <p className="text-sm text-gray-600">Gather customer satisfaction insights</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-green-50">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Event Registration</h3>
                    <p className="text-sm text-gray-600">Collect attendee information</p>
                  </div>
                </GlassCard>

                <GlassCard variant="elevated" className="p-4 cursor-pointer hover:bg-purple-50">
                  <div className="text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-medium">Lead Generation</h3>
                    <p className="text-sm text-gray-600">Capture prospect information</p>
                  </div>
                </GlassCard>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Form Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-semibold">{Math.round((stats.totalResponses / (stats.totalForms * 100)) * 100)}%</span>
                  </div>
                  <Progress value={(stats.totalResponses / (stats.totalForms * 100)) * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Optimization Score</span>
                    <span className="font-semibold">{Math.round(stats.aiOptimizationScore * 100)}%</span>
                  </div>
                  <Progress value={stats.aiOptimizationScore * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth</span>
                    <span className="font-semibold text-green-600">+{Math.round(stats.monthlyGrowth * 100)}%</span>
                  </div>
                  <Progress value={stats.monthlyGrowth * 100} className="h-2" />
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Response Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Week</span>
                    <span className="font-semibold">156 responses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Week</span>
                    <span className="font-semibold">142 responses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <span className="font-semibold">623 responses</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <span className="font-semibold">589 responses</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Form Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-purpose">Form Purpose</Label>
                    <Select value={formPurpose} onValueChange={setFormPurpose}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feedback">Customer Feedback</SelectItem>
                        <SelectItem value="registration">Event Registration</SelectItem>
                        <SelectItem value="lead">Lead Generation</SelectItem>
                        <SelectItem value="survey">Survey</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Textarea
                      id="target-audience"
                      placeholder="Describe your target audience..."
                      rows={3}
                    />
                  </div>
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize Form Structure
                  </Button>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Completion Rate Predictor
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-length">Form Length</Label>
                    <Select value={formLength} onValueChange={setFormLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (3-5 fields)</SelectItem>
                        <SelectItem value="medium">Medium (6-10 fields)</SelectItem>
                        <SelectItem value="long">Long (10+ fields)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="required-fields">Required Fields</Label>
                    <Select value={requiredFields} onValueChange={setRequiredFields}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="extensive">Extensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Predict Completion Rate
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <GlassCard className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Form Builder Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Theme</Label>
                  <Select value={defaultTheme} onValueChange={setDefaultTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Response Storage</Label>
                  <Select value={responseStorage} onValueChange={setResponseStorage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="spreadsheet">Google Sheets</SelectItem>
                      <SelectItem value="email">Email Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>AI Optimization</Label>
                  <Select value={aiOptimization} onValueChange={setAiOptimization}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Auto-save</Label>
                  <Select value={autoSave} onValueChange={setAutoSave}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Form Details Modal */}
      {selectedForm && (
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Form Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</Label>
                  <div className="font-medium">{selectedForm.title}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedForm.status)}>
                    {selectedForm.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Responses</Label>
                  <div className="font-medium">{selectedForm.responses}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</Label>
                  <div className="font-medium">{Math.round(selectedForm.completionRate * 100)}%</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description</Label>
                <div className="text-sm text-gray-700 dark:text-gray-300">{selectedForm.description}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Form Fields</Label>
                <div className="space-y-2">
                  {selectedForm.fields.map(field => (
                    <div key={field.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedForm.gpt5Optimization && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Optimization Insights
                  </Label>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <strong>Predicted Completion Rate:</strong> {Math.round(selectedForm.gpt5Optimization.predictedCompletionRate * 100)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Additional Fields:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedForm.gpt5Optimization.suggestedFields.map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CommunicationDashboard>
  );
}
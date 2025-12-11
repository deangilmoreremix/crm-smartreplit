import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  Brain, 
  Target, 
  Mail, 
  Phone, 
  Calendar, 
  Bell,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Contact } from '../../types/contact';
import { useContactStore } from '../../store/contactStore';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'contact_added' | 'contact_updated' | 'score_changed' | 'time_based' | 'activity_completed';
    conditions: Record<string, any>;
  };
  actions: AutomationAction[];
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  successCount: number;
  failureCount: number;
  createdAt: Date;
}

interface AutomationAction {
  type: 'send_email' | 'schedule_call' | 'update_field' | 'add_tag' | 'create_task' | 'send_notification';
  config: Record<string, any>;
}

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successRate: number;
  timeSaved: number; // in hours
}

const ContactAutomation: React.FC = () => {
  const { contacts, updateContact } = useContactStore();
  
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Welcome New Leads',
      description: 'Send welcome email to new leads and schedule follow-up',
      trigger: {
        type: 'contact_added',
        conditions: { status: 'lead' }
      },
      actions: [
        {
          type: 'send_email',
          config: { templateId: 'welcome_lead', delay: 0 }
        },
        {
          type: 'create_task',
          config: { title: 'Follow up with new lead', delay: 24 }
        }
      ],
      isActive: true,
      successCount: 45,
      failureCount: 2,
      createdAt: new Date('2024-01-01'),
      nextRun: new Date(Date.now() + 3600000)
    },
    {
      id: '2',
      name: 'High-Value Contact Scoring',
      description: 'Auto-tag and notify when contact score exceeds 80',
      trigger: {
        type: 'score_changed',
        conditions: { scoreThreshold: 80 }
      },
      actions: [
        {
          type: 'add_tag',
          config: { tag: 'High Priority' }
        },
        {
          type: 'send_notification',
          config: { message: 'High-value contact identified', recipient: 'sales_team' }
        }
      ],
      isActive: true,
      successCount: 12,
      failureCount: 0,
      createdAt: new Date('2024-01-05')
    },
    {
      id: '3',
      name: 'Inactive Contact Re-engagement',
      description: 'Re-engage contacts with no activity in 30 days',
      trigger: {
        type: 'time_based',
        conditions: { inactiveDays: 30 }
      },
      actions: [
        {
          type: 'send_email',
          config: { templateId: 'reengagement', delay: 0 }
        },
        {
          type: 'update_field',
          config: { field: 'tags', value: 'Re-engagement Campaign' }
        }
      ],
      isActive: false,
      successCount: 8,
      failureCount: 1,
      createdAt: new Date('2024-01-10')
    }
  ]);

  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [stats] = useState<AutomationStats>({
    totalRules: automationRules.length,
    activeRules: automationRules.filter(r => r.isActive).length,
    totalExecutions: automationRules.reduce((sum, r) => sum + r.successCount + r.failureCount, 0),
    successRate: 95.2,
    timeSaved: 24.5
  });

  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this automation rule?')) {
      setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
    }
  };

  const runManuallyNow = async (rule: AutomationRule) => {
    try {
      // Simulate manual execution
      console.log('Running automation rule:', rule.name);
      
      // Update success count
      setAutomationRules(prev =>
        prev.map(r =>
          r.id === rule.id
            ? { ...r, successCount: r.successCount + 1, lastRun: new Date() }
            : r
        )
      );
      
      alert(`Automation rule "${rule.name}" executed successfully!`);
    } catch (error) {
      console.error('Failed to execute rule:', error);
      alert('Failed to execute automation rule');
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'contact_added': return <Users className="h-4 w-4 text-green-600" />;
      case 'contact_updated': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'score_changed': return <Target className="h-4 w-4 text-purple-600" />;
      case 'time_based': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'activity_completed': return <CheckCircle className="h-4 w-4 text-indigo-600" />;
      default: return <Zap className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return <Mail className="h-3 w-3 text-blue-500" />;
      case 'schedule_call': return <Phone className="h-3 w-3 text-green-500" />;
      case 'create_task': return <Calendar className="h-3 w-3 text-orange-500" />;
      case 'send_notification': return <Bell className="h-3 w-3 text-purple-500" />;
      case 'add_tag': return <Target className="h-3 w-3 text-indigo-500" />;
      case 'update_field': return <Edit className="h-3 w-3 text-gray-500" />;
      default: return <Zap className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contact Automation</h2>
          <p className="text-gray-600 mt-1">Automate repetitive tasks and workflows</p>
        </div>
        <button
          onClick={() => setShowCreateRule(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Create Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.timeSaved}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Automation Rules</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {automationRules.map((rule) => (
            <div key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getTriggerIcon(rule.trigger.type)}
                      <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mt-1">{rule.description}</p>
                  
                  {/* Trigger Details */}
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Trigger:</span> {rule.trigger.type.replace('_', ' ')}
                      {rule.trigger.conditions && (
                        <span className="ml-2 text-gray-500">
                          ({Object.entries(rule.trigger.conditions).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Actions:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {rule.actions.map((action, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
                        >
                          {getActionIcon(action.type)}
                          <span className="ml-1">{action.type.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{rule.successCount} successful</span>
                    </div>
                    {rule.failureCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>{rule.failureCount} failed</span>
                      </div>
                    )}
                    {rule.lastRun && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Last run: {rule.lastRun.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => runManuallyNow(rule)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                  >
                    <Play size={14} className="mr-1" />
                    Run Now
                  </button>
                  
                  <button
                    onClick={() => toggleRuleStatus(rule.id)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      rule.isActive
                        ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                    }`}
                  >
                    {rule.isActive ? (
                      <>
                        <Pause size={14} className="mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-1" />
                        Activate
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedRule(rule)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {automationRules.length === 0 && (
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No automation rules</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first automation rule
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateRule(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Automation Rule
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3 text-left">
              <div className="font-medium text-gray-900">Email Sequence</div>
              <div className="text-sm text-gray-600">Create automated email campaigns</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3 text-left">
              <div className="font-medium text-gray-900">Lead Scoring</div>
              <div className="text-sm text-gray-600">Auto-score contacts based on behavior</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3 text-left">
              <div className="font-medium text-gray-900">Follow-up Reminders</div>
              <div className="text-sm text-gray-600">Never miss a follow-up opportunity</div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </button>
        </div>
      </div>

      {/* Create/Edit Rule Modal would go here */}
      {showCreateRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Automation Rule</h3>
            <p className="text-gray-600">
              Automation rule creation interface would be implemented here with form fields for triggers, conditions, and actions.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateRule(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateRule(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactAutomation;

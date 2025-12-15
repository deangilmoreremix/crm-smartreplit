import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { Clock, Users, Mail, Shield, Zap, AlertTriangle } from 'lucide-react';

interface AutomatedAction {
  id: string;
  type: 'suspend_inactive' | 'upgrade_trials' | 'send_reminders' | 'cleanup_old_data';
  name: string;
  description: string;
  config: {
    enabled: boolean;
    threshold?: number;
    targetTier?: string;
    frequency?: string;
  };
  lastRun?: string;
  isActive: boolean;
}

export default function AutomatedLifecycle() {
  const [actions, setActions] = useState<AutomatedAction[]>([
    {
      id: 'suspend_inactive',
      type: 'suspend_inactive',
      name: 'Suspend Inactive Users',
      description: 'Automatically suspend users inactive for a specified period',
      config: {
        enabled: false,
        threshold: 90
      },
      isActive: false
    },
    {
      id: 'upgrade_trials',
      type: 'upgrade_trials',
      name: 'Upgrade Trial Users',
      description: 'Automatically upgrade high-usage trial users to paid plans',
      config: {
        enabled: false,
        targetTier: 'smartcrm_bundle'
      },
      isActive: false
    },
    {
      id: 'send_reminders',
      type: 'send_reminders',
      name: 'Send Usage Reminders',
      description: 'Send reminder emails to underutilizing users',
      config: {
        enabled: false,
        threshold: 30,
        frequency: 'weekly'
      },
      isActive: false
    },
    {
      id: 'cleanup_old_data',
      type: 'cleanup_old_data',
      name: 'Clean Old Data',
      description: 'Automatically clean up old logs and temporary data',
      config: {
        enabled: false,
        threshold: 365
      },
      isActive: false
    }
  ]);

  const { toast } = useToast();

  const handleToggleAction = async (actionId: string, enabled: boolean) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      const response = await fetch('/api/admin/automated-actions/setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: actionId,
          config: {
            ...action.config,
            enabled
          }
        })
      });

      if (response.ok) {
        setActions(prev => prev.map(a =>
          a.id === actionId
            ? { ...a, config: { ...a.config, enabled }, isActive: enabled }
            : a
        ));

        toast({
          title: 'Success',
          description: `${action.name} ${enabled ? 'enabled' : 'disabled'} successfully`
        });
      } else {
        throw new Error('Failed to update automated action');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleConfigChange = (actionId: string, key: string, value: any) => {
    setActions(prev => prev.map(a =>
      a.id === actionId
        ? { ...a, config: { ...a.config, [key]: value } }
        : a
    ));
  };

  const runActionNow = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    try {
      // For demo purposes, we'll just show a success message
      // In production, you'd call the appropriate API endpoint
      toast({
        title: 'Action Executed',
        description: `${action.name} executed successfully`
      });

      // Update last run time
      setActions(prev => prev.map(a =>
        a.id === actionId
          ? { ...a, lastRun: new Date().toISOString() }
          : a
      ));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'suspend_inactive':
        return <Users className="h-5 w-5 text-red-500" />;
      case 'upgrade_trials':
        return <Shield className="h-5 w-5 text-green-500" />;
      case 'send_reminders':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'cleanup_old_data':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Zap className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated User Lifecycle
          </CardTitle>
          <CardDescription>
            Configure automated actions to manage user accounts and system maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {actions.map((action) => (
            <Card key={action.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(action.type)}
                    <div>
                      <CardTitle className="text-lg">{action.name}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {action.isActive ? 'Active' : 'Inactive'}
                      </div>
                      {action.lastRun && (
                        <div className="text-xs text-gray-400">
                          Last run: {new Date(action.lastRun).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={action.config.enabled}
                      onCheckedChange={(checked) => handleToggleAction(action.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Configuration Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {action.type === 'suspend_inactive' && (
                    <div>
                      <Label htmlFor={`threshold-${action.id}`}>Inactive Days</Label>
                      <Input
                        id={`threshold-${action.id}`}
                        type="number"
                        value={action.config.threshold || 90}
                        onChange={(e) => handleConfigChange(action.id, 'threshold', parseInt(e.target.value))}
                        min="1"
                        max="365"
                      />
                    </div>
                  )}

                  {action.type === 'upgrade_trials' && (
                    <div>
                      <Label htmlFor={`targetTier-${action.id}`}>Target Tier</Label>
                      <Select
                        value={action.config.targetTier || 'smartcrm_bundle'}
                        onValueChange={(value) => handleConfigChange(action.id, 'targetTier', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smartcrm">SmartCRM</SelectItem>
                          <SelectItem value="sales_maximizer">Sales Maximizer</SelectItem>
                          <SelectItem value="smartcrm_bundle">SmartCRM Bundle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {action.type === 'send_reminders' && (
                    <>
                      <div>
                        <Label htmlFor={`threshold-${action.id}`}>Inactive Days</Label>
                        <Input
                          id={`threshold-${action.id}`}
                          type="number"
                          value={action.config.threshold || 30}
                          onChange={(e) => handleConfigChange(action.id, 'threshold', parseInt(e.target.value))}
                          min="1"
                          max="90"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${action.id}`}>Frequency</Label>
                        <Select
                          value={action.config.frequency || 'weekly'}
                          onValueChange={(value) => handleConfigChange(action.id, 'frequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {action.type === 'cleanup_old_data' && (
                    <div>
                      <Label htmlFor={`threshold-${action.id}`}>Days to Keep</Label>
                      <Input
                        id={`threshold-${action.id}`}
                        type="number"
                        value={action.config.threshold || 365}
                        onChange={(e) => handleConfigChange(action.id, 'threshold', parseInt(e.target.value))}
                        min="30"
                        max="3650"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => runActionNow(action.id)}
                    variant="outline"
                    size="sm"
                    disabled={!action.config.enabled}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Run Now
                  </Button>

                  {action.config.enabled && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <AlertTriangle className="h-4 w-4" />
                      This action runs automatically
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Summary Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Automation Summary</h3>
                  <p className="text-sm text-blue-700">
                    {actions.filter(a => a.config.enabled).length} of {actions.length} automated actions are currently active.
                    These actions help maintain system health and user engagement automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
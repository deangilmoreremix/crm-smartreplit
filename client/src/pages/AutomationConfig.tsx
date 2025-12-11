import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Save, Play, Pause, Clock, Calendar, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const AutomationConfig = () => {
  const { isDark } = useTheme();
  const [, params] = useRoute('/automations/:id');
  const [, navigate] = useLocation();
  const automationId = params?.id || '';

  const [isEnabled, setIsEnabled] = useState(false);
  const [schedule, setSchedule] = useState('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');

  const automationTitles: Record<string, { title: string; description: string }> = {
    'email-followup': { title: 'Email Follow-Up', description: 'Automatically send follow-up emails after meetings' },
    'sms-reminder': { title: 'SMS Reminders', description: 'Send appointment reminders via text message' },
    'call-followup': { title: 'Call Follow-Up', description: 'Schedule calls after no-shows' },
    'task-reminder': { title: 'Task Reminders', description: 'Daily digest of pending tasks' },
    'deal-stage-move': { title: 'Auto Move Deals', description: 'Move deals based on activity' },
    'lead-scoring': { title: 'Lead Scoring', description: 'Auto-score leads by engagement' },
    'stale-deal-alert': { title: 'Stale Deal Alerts', description: 'Alert on inactive deals' },
    'win-probability': { title: 'Win Probability', description: 'Auto-calculate deal win rates' },
    'birthday-greeting': { title: 'Birthday Greetings', description: 'Send birthday wishes automatically' },
    'milestone-celebration': { title: 'Milestone Alerts', description: 'Celebrate client anniversaries' },
    'referral-request': { title: 'Referral Requests', description: 'Ask happy clients for referrals' },
    'check-in-sequence': { title: 'Check-In Sequence', description: 'Regular touchpoints with clients' },
    'meeting-notes': { title: 'Meeting Notes', description: 'Auto-generate meeting summaries' },
    'daily-brief': { title: 'Daily Brief', description: 'Morning summary of your day' },
    'data-entry': { title: 'Smart Data Entry', description: 'Auto-populate contact info' },
    'task-auto-create': { title: 'Auto-Create Tasks', description: 'Generate tasks from emails' },
  };

  const automation = automationTitles[automationId] || { 
    title: 'Automation Configuration', 
    description: 'Configure your automation settings' 
  };

  const handleSave = () => {
    console.log('Saving automation config:', {
      automationId,
      isEnabled,
      schedule,
      timeOfDay,
    });
    // TODO: Save to backend
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 mb-4 ${
              isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} data-testid="heading-automation-title">
            {automation.title}
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} data-testid="text-automation-description">
            {automation.description}
          </p>
        </div>

        {/* Configuration Card */}
        <Card className={`p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} data-testid="label-enable">
                  Enable Automation
                </Label>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`} data-testid="text-enable-help">
                  Turn this automation on or off
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                data-testid="switch-enable"
              />
            </div>

            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Schedule */}
            <div className="space-y-4">
              <Label className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} data-testid="label-schedule">
                <Clock className="h-4 w-4 inline mr-2" />
                Schedule
              </Label>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : 'text-gray-700'} data-testid="label-frequency">Frequency</Label>
                  <Select value={schedule} onValueChange={setSchedule}>
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={isDark ? 'text-gray-300' : 'text-gray-700'} data-testid="label-time">Time of Day</Label>
                  <Input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    data-testid="input-time"
                  />
                </div>
              </div>
            </div>

            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Advanced Settings */}
            <div className="space-y-4">
              <Label className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} data-testid="label-advanced">
                <Settings className="h-4 w-4 inline mr-2" />
                Advanced Settings
              </Label>
              
              <div className="space-y-2">
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'} data-testid="label-custom-rules">Custom Rules</Label>
                <Textarea
                  placeholder="Add custom conditions or rules for this automation..."
                  className={isDark ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  rows={4}
                  data-testid="textarea-rules"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
              data-testid="button-save"
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className={`mt-6 p-6 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`} data-testid="card-info">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Calendar className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'}`} data-testid="heading-how-it-works">
                How Automations Work
              </h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`} data-testid="text-how-it-works">
                Once enabled, this automation will run automatically based on your schedule. 
                You'll receive notifications when actions are taken, and you can view the 
                automation history in your activity log.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AutomationConfig;

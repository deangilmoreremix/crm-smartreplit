import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useWhitelabel } from '../../contexts/WhitelabelContext';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ColorInput } from '../ui/ColorInput';
import { FeatureTooltip } from '../ui/Tooltip';
import {
  Settings,
  BarChart3,
  Users,
  Zap,
  Brain,
  Plus,
  Trash2,
  Edit,
  Check,
  LayoutDashboard
} from 'lucide-react';
import { DashboardSectionConfig, CustomKPIConfig } from '../../types/whitelabel';

const PREDEFINED_SECTIONS = [
  { id: 'executive-overview-section', name: 'Executive Overview', icon: 'BarChart3', description: 'Key metrics and performance overview' },
  { id: 'ai-smart-features-hub', name: 'AI Features Hub', icon: 'Brain', description: 'AI-powered tools and insights' },
  { id: 'sales-pipeline-deal-analytics', name: 'Sales Pipeline', icon: 'Users', description: 'Deal tracking and analytics' },
  { id: 'customer-lead-management', name: 'Customer Management', icon: 'Users', description: 'Contact and lead management' },
  { id: 'activities-communications', name: 'Communications', icon: 'Zap', description: 'Email, calls, and messaging' },
  { id: 'integrations-system', name: 'Integrations', icon: 'Settings', description: 'Connected apps and services' }
];

const ICON_OPTIONS = [
  { value: 'BarChart3', label: 'Analytics', icon: BarChart3 },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Settings', label: 'Settings', icon: Settings },
  { value: 'Zap', label: 'Lightning', icon: Zap },
  { value: 'Brain', label: 'AI Brain', icon: Brain },
  { value: 'Check', label: 'Check', icon: Check }
];

export const DashboardCustomization: React.FC = () => {
  const { isDark } = useTheme();
  const { config, updateConfig } = useWhitelabel();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [newKPIForm, setNewKPIForm] = useState<Partial<CustomKPIConfig>>({
    label: '',
    description: '',
    icon: 'BarChart3',
    color: '#3B82F6',
    enabled: true
  });

  const updateDashboardSection = (sectionId: string, updates: Partial<DashboardSectionConfig>) => {
    const newSections = { ...config.dashboardSections };
    if (newSections[sectionId]) {
      newSections[sectionId] = { ...newSections[sectionId], ...updates };
    }
    updateConfig({ dashboardSections: newSections });
  };

  const addCustomKPI = () => {
    if (!newKPIForm.label || !newKPIForm.description) return;

    const newKPI: CustomKPIConfig = {
      id: `kpi_${Date.now()}`,
      label: newKPIForm.label,
      description: newKPIForm.description,
      icon: newKPIForm.icon || 'BarChart3',
      color: newKPIForm.color || '#3B82F6',
      enabled: newKPIForm.enabled !== false
    };

    updateConfig({
      customKPIs: [...config.customKPIs, newKPI]
    });

    setNewKPIForm({
      label: '',
      description: '',
      icon: 'BarChart3',
      color: '#3B82F6',
      enabled: true
    });
  };

  const updateCustomKPI = (kpiId: string, updates: Partial<CustomKPIConfig>) => {
    const newKPIs = config.customKPIs.map(kpi =>
      kpi.id === kpiId ? { ...kpi, ...updates } : kpi
    );
    updateConfig({ customKPIs: newKPIs });
  };

  const removeCustomKPI = (kpiId: string) => {
    updateConfig({
      customKPIs: config.customKPIs.filter(kpi => kpi.id !== kpiId)
    });
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Sections Customization */}
      <GlassCard>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <LayoutDashboard className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold">Dashboard Sections</h3>
            <FeatureTooltip
              feature="Dashboard Sections"
              description="Customize the appearance and content of dashboard sections to match your brand and business needs."
              benefits={[
                "Rebrand section titles and descriptions",
                "Change section icons and colors",
                "Show/hide sections based on user roles",
                "Maintain consistent branding across the platform"
              ]}
              examples={[
                "Rename 'AI Features Hub' to 'Smart Analytics Suite'",
                "Change section colors to match company branding",
                "Hide advanced features for basic users"
              ]}
            />
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PREDEFINED_SECTIONS.map((section) => {
              const customConfig = config.dashboardSections[section.id];
              const isEnabled = customConfig ? customConfig.enabled : true;
              const displayTitle = customConfig?.title || section.name;
              const displayDescription = customConfig?.description || section.description;
              const displayIcon = customConfig?.icon || section.icon;

              return (
                <div
                  key={section.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isEnabled
                      ? (isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50')
                      : (isDark ? 'border-gray-700 bg-gray-800/50 opacity-60' : 'border-gray-300 bg-gray-100 opacity-60')
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {React.createElement(
                          ICON_OPTIONS.find(opt => opt.value === displayIcon)?.icon || Settings,
                          { className: `h-4 w-4 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}` }
                        )}
                      </div>
                      <div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {displayTitle}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {displayDescription}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isEnabled ? "default" : "secondary"}>
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingSection === section.id && (
                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={displayTitle}
                          onChange={(e) => updateDashboardSection(section.id, { title: e.target.value })}
                          placeholder={section.name}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={displayDescription}
                          onChange={(e) => updateDashboardSection(section.id, { description: e.target.value })}
                          placeholder={section.description}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label className="text-xs">Icon</Label>
                          <select
                            value={displayIcon}
                            onChange={(e) => updateDashboardSection(section.id, { icon: e.target.value })}
                            className={`w-full mt-1 px-3 py-2 border rounded-md text-sm ${
                              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                            }`}
                          >
                            {ICON_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Custom Color</Label>
                          <ColorInput
                            id={`section-color-${section.id}`}
                            value={customConfig?.customColor || '#3B82F6'}
                            onChange={(color) => updateDashboardSection(section.id, { customColor: color })}
                            label=""
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => updateDashboardSection(section.id, { enabled: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Enabled</span>
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSection(null)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Custom KPIs */}
      <GlassCard>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
            <h3 className="text-lg font-semibold">Custom KPI Cards</h3>
            <FeatureTooltip
              feature="Custom KPI Cards"
              description="Create branded KPI cards that display your most important business metrics with custom colors and icons."
              benefits={[
                "Display company-specific metrics",
                "Custom branding for KPI cards",
                "Flexible metric definitions",
                "Enhanced dashboard personalization"
              ]}
              examples={[
                "Add 'Monthly Recurring Revenue' KPI",
                "Create 'Customer Satisfaction Score' metric",
                "Track 'Lead Conversion Rate' with custom styling"
              ]}
            />
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Add New KPI Form */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
            <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Add New KPI
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Label</Label>
                <Input
                  value={newKPIForm.label}
                  onChange={(e) => setNewKPIForm({...newKPIForm, label: e.target.value})}
                  placeholder="e.g., Monthly Revenue"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newKPIForm.description}
                  onChange={(e) => setNewKPIForm({...newKPIForm, description: e.target.value})}
                  placeholder="Brief description of the metric"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <select
                  value={newKPIForm.icon}
                  onChange={(e) => setNewKPIForm({...newKPIForm, icon: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {ICON_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Color</Label>
                <ColorInput
                  id="new-kpi-color"
                  value={newKPIForm.color || '#3B82F6'}
                  onChange={(color) => setNewKPIForm({...newKPIForm, color})}
                  label=""
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={addCustomKPI} disabled={!newKPIForm.label || !newKPIForm.description} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add KPI
              </Button>
            </div>
          </div>

          {/* Existing KPIs */}
          <div className="space-y-3">
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Current KPIs ({config.customKPIs.length})
            </h4>
            {config.customKPIs.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No custom KPIs added yet. Add your first KPI above.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.customKPIs.map((kpi) => (
                  <div
                    key={kpi.id}
                    className={`border rounded-lg p-4 transition-all ${
                      kpi.enabled
                        ? (isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-white')
                        : (isDark ? 'border-gray-700 bg-gray-800/50 opacity-60' : 'border-gray-300 bg-gray-100 opacity-60')
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${kpi.color}20` }}
                        >
                          {React.createElement(
                            ICON_OPTIONS.find(opt => opt.value === kpi.icon)?.icon || BarChart3,
                            { className: "h-4 w-4", style: { color: kpi.color } }
                          )}
                        </div>
                        <div>
                          <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {kpi.label}
                          </h5>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {kpi.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={kpi.enabled ? "default" : "secondary"}>
                          {kpi.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingKPI(editingKPI === kpi.id ? null : kpi.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomKPI(kpi.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {editingKPI === kpi.id && (
                      <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={kpi.label}
                            onChange={(e) => updateCustomKPI(kpi.id, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={kpi.description}
                            onChange={(e) => updateCustomKPI(kpi.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Label className="text-xs">Icon</Label>
                            <select
                              value={kpi.icon}
                              onChange={(e) => updateCustomKPI(kpi.id, { icon: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${
                                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                              }`}
                            >
                              {ICON_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Color</Label>
                            <ColorInput
                              id={`kpi-color-${kpi.id}`}
                              value={kpi.color}
                              onChange={(color) => updateCustomKPI(kpi.id, { color })}
                              label=""
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={kpi.enabled}
                              onChange={(e) => updateCustomKPI(kpi.id, { enabled: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">Enabled</span>
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingKPI(null)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

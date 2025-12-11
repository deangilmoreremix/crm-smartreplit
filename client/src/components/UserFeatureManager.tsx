import { useState, useMemo } from 'react';
import { useEffectiveFeatures, useFeatures, useSetUserFeature, useRemoveUserFeature } from '@/hooks/useFeatures';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, X, ChevronDown, ChevronRight, Search, Shield, Zap, Users, Briefcase, Lock, Settings, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserFeatureManagerProps {
  userId: string;
  productTier?: 'smartcrm' | 'sales_maximizer' | 'ai_boost_unlimited';
}

export function UserFeatureManager({ userId, productTier }: UserFeatureManagerProps) {
  // ALL HOOKS MUST BE CALLED IN THE SAME ORDER ON EVERY RENDER
  const { data: effectiveFeatures = [], isLoading } = useEffectiveFeatures(userId);
  const { data: allFeatures = [] } = useFeatures();
  const setUserFeature = useSetUserFeature();
  const removeUserFeature = useRemoveUserFeature();
  const { toast } = useToast();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core_crm']));
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'core_crm', label: 'Core CRM', icon: Briefcase, color: 'blue' },
    { value: 'communication', label: 'Communication', icon: Users, color: 'green' },
    { value: 'ai_features', label: 'AI Features', icon: Zap, color: 'purple' },
    { value: 'business_tools', label: 'Business Tools', icon: Settings, color: 'orange' },
    { value: 'advanced', label: 'Advanced', icon: Shield, color: 'red' },
    { value: 'admin', label: 'Admin', icon: Lock, color: 'gray' },
  ];

  // MOVE useMemo BEFORE CONDITIONAL EARLY RETURN - FIXES HOOK VIOLATION
  const featuresByCategory = useMemo(() => {
    return categories.map(category => {
      const categoryFeatures = allFeatures
        .filter(f => f.category === category.value)
        .filter(f => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return f.name.toLowerCase().includes(query) || 
                 f.description?.toLowerCase().includes(query) ||
                 f.featureKey.toLowerCase().includes(query);
        })
        .map(feature => {
          const effectiveFeature = effectiveFeatures.find(ef => ef.featureId === feature.id);
          return {
            ...feature,
            enabled: effectiveFeature?.enabled || false,
            source: effectiveFeature?.source || 'tier',
            expiresAt: effectiveFeature?.expiresAt,
            overrideId: effectiveFeature?.overrideId,
          };
        });

      return {
        ...category,
        features: categoryFeatures,
        count: categoryFeatures.length,
        enabledCount: categoryFeatures.filter(f => f.enabled).length,
      };
    }).filter(cat => cat.count > 0);
  }, [categories, allFeatures, effectiveFeatures, searchQuery]);

  const totalFeatures = featuresByCategory.reduce((sum, cat) => sum + cat.count, 0);
  const totalEnabled = featuresByCategory.reduce((sum, cat) => sum + cat.enabledCount, 0);
  const totalOverrides = effectiveFeatures.filter(ef => ef.source === 'override').length;

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggleFeature = async (featureId: number, currentState: boolean) => {
    // Always create or update override
    try {
      await setUserFeature.mutateAsync({
        userId,
        featureId,
        enabled: !currentState,
      });
      toast({
        title: 'Success',
        description: `Feature ${!currentState ? 'enabled' : 'disabled'} for this user`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    }
  };

  // NOW THE EARLY RETURN CAN HAPPEN - ALL HOOKS ALREADY CALLED
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        Loading features...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage user permissions and feature access
            </p>
          </div>
          {productTier && (
            <Badge className="text-sm px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700">
              {productTier.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Features</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalFeatures}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Enabled</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{totalEnabled}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Custom Overrides</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{totalOverrides}</div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>How it works:</strong> Features with the <Badge variant="outline" className="text-xs text-orange-600 dark:text-orange-400 ml-1">Override</Badge> badge are custom permissions set specifically for this user. All other features are inherited from their product tier.
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search features by name, description, or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Feature Categories */}
      {featuresByCategory.length === 0 && searchQuery && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No features found matching "{searchQuery}"</p>
          <Button 
            variant="link" 
            onClick={() => setSearchQuery('')}
            className="mt-2"
          >
            Clear search
          </Button>
        </div>
      )}

      {featuresByCategory.map((category) => {
        const CategoryIcon = category.icon;
        const colorClasses = {
          blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
          green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
          purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
          orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
          red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
          gray: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300',
        }[category.color] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';

        return (
          <div key={category.value} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleCategory(category.value)}
              className={`w-full flex items-center justify-between p-4 ${colorClasses} border-b transition-all hover:opacity-90`}
              data-testid={`button-toggle-${category.value}`}
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(category.value) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <CategoryIcon className="h-5 w-5" />
                <span className="font-semibold text-base">{category.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {category.enabledCount}/{category.count} enabled
                </Badge>
              </div>
            </button>

          {expandedCategories.has(category.value) && (
            <div className="p-2">
              {category.features.map((feature) => (
                <div
                  key={feature.id}
                  className="group flex items-start justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all mb-2 last:mb-0"
                  data-testid={`feature-row-${feature.id}`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {feature.name}
                      </span>
                      {feature.source === 'override' && (
                        <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                          Custom Override
                        </Badge>
                      )}
                      {feature.expiresAt && (
                        <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {new Date(feature.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    {feature.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                    {feature.source === 'tier' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                        Inherited from product tier
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => handleToggleFeature(feature.id, feature.enabled)}
                        data-testid={`switch-feature-${feature.id}`}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {feature.source === 'override' && feature.overrideId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          try {
                            await removeUserFeature.mutateAsync({ userId, featureId: feature.id });
                            toast({
                              title: 'Override Removed',
                              description: 'User will now inherit the default from their product tier.',
                            });
                          } catch (error) {
                            toast({
                              title: 'Error',
                              description: 'Failed to remove override',
                              variant: 'destructive',
                            });
                          }
                        }}
                        data-testid={`button-remove-override-${feature.id}`}
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

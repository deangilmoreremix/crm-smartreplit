import { useState, useEffect } from 'react';
import { useRole } from '../components/RoleBasedAccess';
import { hasFeatureAccess } from '../config/featureTiers';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  route: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'account' | 'features' | 'billing';
}

export const useOnboarding = () => {
  const { user, canAccess } = useRole();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`onboarding-${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      } catch (error) {
        console.warn('Failed to parse onboarding data:', error);
      }
    }
  }, [user?.id]);

  // Save completed steps to localStorage
  const saveCompletedSteps = (steps: Set<string>) => {
    if (user?.id) {
      localStorage.setItem(`onboarding-${user?.id}`, JSON.stringify([...steps]));
    }
  };

  const markStepCompleted = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    saveCompletedSteps(newCompleted);
  };

  const getOnboardingSteps = (): OnboardingStep[] => {
    if (!user) return [];

    const steps: OnboardingStep[] = [];

    // Account setup steps
    if (!user.firstName || !user.lastName) {
      steps.push({
        id: 'profile_completion',
        title: 'Complete Your Profile',
        description: 'Add your name and contact information',
        action: 'Update Profile',
        route: '/settings',
        completed: completedSteps.has('profile_completion'),
        priority: 'high',
        category: 'account'
      });
    }

    // Billing/product tier steps
    if (!user.productTier) {
      steps.push({
        id: 'subscription_selection',
        title: 'Choose Your Plan',
        description: 'Select a subscription plan to unlock premium features',
        action: 'View Plans',
        route: '/upgrade',
        completed: completedSteps.has('subscription_selection'),
        priority: 'high',
        category: 'billing'
      });
    }

    // Feature-specific onboarding
    if (canAccess('contacts')) {
      steps.push({
        id: 'first_contact_import',
        title: 'Import Your Contacts',
        description: 'Upload your contact list to get started',
        action: 'Import Contacts',
        route: '/contacts',
        completed: completedSteps.has('first_contact_import'),
        priority: 'medium',
        category: 'features'
      });
    }

    if (canAccess('aiTools')) {
      steps.push({
        id: 'ai_setup',
        title: 'Set Up AI Tools',
        description: 'Configure your AI preferences and try your first AI feature',
        action: 'Explore AI Tools',
        route: '/ai-tools',
        completed: completedSteps.has('ai_setup'),
        priority: 'medium',
        category: 'features'
      });

      steps.push({
        id: 'first_ai_interaction',
        title: 'Try AI Assistant',
        description: 'Have your first conversation with the AI assistant',
        action: 'Start Chat',
        route: '/ai-tools',
        completed: completedSteps.has('first_ai_interaction'),
        priority: 'low',
        category: 'features'
      });
    }

    if (canAccess('pipeline')) {
      steps.push({
        id: 'create_first_deal',
        title: 'Create Your First Deal',
        description: 'Add a deal to your sales pipeline',
        action: 'Add Deal',
        route: '/pipeline',
        completed: completedSteps.has('create_first_deal'),
        priority: 'medium',
        category: 'features'
      });
    }

    // Admin-specific steps
    if (user.role === 'super_admin') {
      steps.push({
        id: 'admin_overview',
        title: 'Admin Panel Tour',
        description: 'Learn about user management and system settings',
        action: 'Admin Dashboard',
        route: '/admin',
        completed: completedSteps.has('admin_overview'),
        priority: 'low',
        category: 'account'
      });
    }

    return steps.filter(step => !step.completed);
  };

  const getNextStep = (): OnboardingStep | null => {
    const steps = getOnboardingSteps();
    if (steps.length === 0) return null;

    // Return highest priority incomplete step
    return steps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })[0];
  };

  const getProgress = (): { completed: number; total: number; percentage: number } => {
    const allSteps = getOnboardingSteps().concat(
      // Include completed steps for total count
      Array.from(completedSteps).map(id => ({ id } as any))
    );

    const completed = completedSteps.size;
    const total = allSteps.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

    return { completed, total, percentage };
  };

  const resetOnboarding = () => {
    setCompletedSteps(new Set());
    if (user?.id) {
      localStorage.removeItem(`onboarding-${user.id}`);
    }
  };

  return {
    steps: getOnboardingSteps(),
    nextStep: getNextStep(),
    progress: getProgress(),
    markStepCompleted,
    resetOnboarding,
    isComplete: getOnboardingSteps().length === 0
  };
};
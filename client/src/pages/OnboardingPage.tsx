import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlow } from '../components/Onboarding';
import { useAuth } from '../contexts/AuthContext';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = () => {
    // Mark onboarding as complete and redirect to dashboard
    if (user?.id) {
      localStorage.setItem(`onboarding-${user.id}`, JSON.stringify([
        'profile_completion',
        'subscription_selection',
        'first_contact_import',
        'ai_setup',
        'calendar_connect',
        'pipeline_config',
        'team_invite',
      ]));
    }
    navigate('/dashboard');
  };

  const handleSkip = () => {
    // Skip onboarding and go to dashboard
    navigate('/dashboard');
  };

  return <OnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />;
};

export default OnboardingPage;

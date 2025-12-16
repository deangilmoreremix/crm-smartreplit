import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, ArrowRight, Sparkles, User, Settings, CreditCard, Zap } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';

export const OnboardingWidget: React.FC = () => {
  const navigate = useNavigate();
  const { steps, nextStep, progress, markStepCompleted } = useOnboarding();

  if (steps.length === 0) {
    return null; // All onboarding complete
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account': return <User className="h-4 w-4" />;
      case 'billing': return <CreditCard className="h-4 w-4" />;
      case 'features': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">Welcome to SmartCRM!</CardTitle>
              <CardDescription className="text-blue-700">
                Let's get you set up in just a few steps
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            {progress.completed}/{progress.total} Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
            <span>Setup Progress</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Next Recommended Step */}
        {nextStep && (
          <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(nextStep.category)}
                  <h3 className="font-medium text-blue-900">{nextStep.title}</h3>
                  <Badge className={`text-xs ${getPriorityColor(nextStep.priority)}`}>
                    {nextStep.priority}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 mb-3">{nextStep.description}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                markStepCompleted(nextStep.id);
                navigate(nextStep.route);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {nextStep.action}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* All Remaining Steps */}
        {steps.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900">Upcoming Steps:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {steps.slice(1, 4).map((step) => (
                <div key={step.id} className="flex items-center justify-between p-2 bg-white/50 rounded border border-blue-100">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {getCategoryIcon(step.category)}
                    <span className="text-sm text-blue-800 truncate">{step.title}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(step.priority)}`}>
                    {step.priority}
                  </Badge>
                </div>
              ))}
              {steps.length > 4 && (
                <div className="text-center text-xs text-blue-600 py-1">
                  +{steps.length - 4} more steps
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skip Option */}
        <div className="pt-2 border-t border-blue-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Mark all steps as completed
              steps.forEach(step => markStepCompleted(step.id));
            }}
            className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            Skip Setup (you can always return later)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
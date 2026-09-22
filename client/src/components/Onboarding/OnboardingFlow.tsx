import React, { useState } from 'react';
import {
  Calendar,
  UserPlus,
  GitBranch,
  Users,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Connect Calendar',
    description: 'Sync your calendar to track meetings and schedule events',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    title: 'Add First Contact',
    description: 'Start building your contacts list or import existing ones',
    icon: UserPlus,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    title: 'Configure Pipeline',
    description: 'Set up your sales stages and deal workflow',
    icon: GitBranch,
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 4,
    title: 'Invite Team Members',
    description: 'Add teammates to collaborate on deals and contacts',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
  },
];

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (completedSteps.includes(index) || index === currentStep) {
      setCurrentStep(index);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div
      className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'} flex items-center justify-center p-4`}
    >
      <div
        className={`w-full max-w-2xl ${isDark ? 'bg-gray-800/80' : 'bg-white'} backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-gray-200'} rounded-3xl shadow-2xl overflow-hidden`}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome to SmartCRM
            </h1>
            <button
              onClick={handleSkip}
              className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
            >
              Skip setup
            </button>
          </div>

          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!completedSteps.includes(index) && index !== currentStep}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    completedSteps.includes(index)
                      ? `bg-gradient-to-r ${step.color} text-white`
                      : index === currentStep
                        ? `bg-gradient-to-r ${step.color} text-white ring-4 ${isDark ? 'ring-gray-700' : 'ring-white'} ring-opacity-50`
                        : isDark
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-gray-200 text-gray-400'
                  } ${completedSteps.includes(index) || index === currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  {completedSteps.includes(index) ? <Check size={18} /> : <step.icon size={18} />}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      completedSteps.includes(index)
                        ? `bg-gradient-to-r ${steps[index].color.split(' ')[0]} ${steps[index].color.split(' ')[2]}`
                        : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${steps[currentStep].color} mb-4`}
            >
              <StepIcon size={32} className="text-white" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {steps[currentStep].title}
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {steps[currentStep].description}
            </p>
          </div>

          <div className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-2xl p-6 mb-6`}>
            {currentStep === 0 && (
              <div className="space-y-4">
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-800' : 'border-gray-200 hover:border-blue-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Calendar size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Google Calendar
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Connect your Google account
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`}
                  />
                </button>
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-800' : 'border-gray-200 hover:border-blue-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                      <Calendar size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Microsoft Outlook
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Connect your Outlook account
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`}
                  />
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-purple-500 bg-gray-800' : 'border-gray-200 hover:border-purple-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Add New Contact
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Create a single contact manually
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-purple-500' : 'text-gray-400 group-hover:text-purple-500'} transition-colors`}
                  />
                </button>
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-purple-500 bg-gray-800' : 'border-gray-200 hover:border-purple-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Import Contacts
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Import from CSV or Excel file
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-purple-500' : 'text-gray-400 group-hover:text-purple-500'} transition-colors`}
                  />
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-orange-500 bg-gray-800' : 'border-gray-200 hover:border-orange-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                      <GitBranch size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Use Default Pipeline
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Start with standard sales stages
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-orange-500' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}
                  />
                </button>
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-orange-500 bg-gray-800' : 'border-gray-200 hover:border-orange-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center">
                      <GitBranch size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Customize Pipeline
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Create your own stages and workflow
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-orange-500' : 'text-gray-400 group-hover:text-orange-500'} transition-colors`}
                  />
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-green-500 bg-gray-800' : 'border-gray-200 hover:border-green-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Invite Team Members
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Send email invitations to teammates
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-green-500' : 'text-gray-400 group-hover:text-green-500'} transition-colors`}
                  />
                </button>
                <button
                  className={`w-full p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:border-green-500 bg-gray-800' : 'border-gray-200 hover:border-green-500 bg-white'} transition-colors flex items-center justify-between group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Skip for Now
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Invite teammates later from settings
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`${isDark ? 'text-gray-600 group-hover:text-green-500' : 'text-gray-400 group-hover:text-green-500'} transition-colors`}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? isDark
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 cursor-not-allowed'
                  : isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? `bg-gradient-to-r ${steps[currentStep].color}`
                      : completedSteps.includes(index)
                        ? isDark
                          ? 'bg-green-500'
                          : 'bg-green-500'
                        : isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r ${steps[currentStep].color} text-white font-medium transition-all hover:scale-105 hover:shadow-lg`}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

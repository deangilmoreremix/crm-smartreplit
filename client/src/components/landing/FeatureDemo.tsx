import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Calendar, Mail, Phone, Plus, FileText, Users, Target } from 'lucide-react';

interface DemoFeature {
  id: string;
  title: string;
  snippet: React.ReactNode;
}

const FeatureDemo: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState('email-composer');
  const [isAnimating, setIsAnimating] = useState(false);

  const demoFeatures: DemoFeature[] = [
    {
      id: 'email-composer',
      title: 'AI Email Composer',
      snippet: (
        <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 h-full">
          <div className="mb-3 border-b pb-2 flex justify-between items-center">
            <h4 className="text-sm font-semibold">New Email to: John Smith</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
              <div className="p-2 bg-white border rounded-md text-sm">
                Follow up on our recent conversation about enterprise features
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Body</label>
              <div className="p-2 bg-white border rounded-md text-sm h-32 overflow-auto">
                <p className="mb-2">Hi John,</p>
                <p className="mb-2">I hope this email finds you well. I wanted to follow up on our conversation last week about the enterprise features you were interested in.</p>
                <p className="mb-2">As discussed, our platform offers advanced security features, custom integrations, and dedicated support that would address the challenges you mentioned.</p>
                <p className="mb-2">Would you have time for a quick call this week to discuss these features in more detail?</p>
                <p className="mb-2">Best regards,<br/>Alex</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div className="text-xs text-gray-500">AI generated • Personalized</div>
              <button className="text-xs bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors">
                Send Email
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'meeting-summary',
      title: 'Meeting Summarizer',
      snippet: (
        <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 h-full">
          <div className="mb-3 border-b pb-2 flex justify-between items-center">
            <h4 className="text-sm font-semibold">Acme Corp Meeting Summary</h4>
          </div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h5 className="text-xs font-medium text-blue-800 mb-1">Key Discussion Points:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Product roadmap for Q3</li>
                <li>• Integration requirements</li>
                <li>• Security compliance needs</li>
                <li>• Pricing structure for enterprise tier</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md border border-green-100">
              <h5 className="text-xs font-medium text-green-800 mb-1">Action Items:</h5>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Send technical documentation by Friday</li>
                <li>• Schedule security review call next week</li>
                <li>• Prepare custom pricing proposal</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
              <h5 className="text-xs font-medium text-amber-800 mb-1">Follow-Up:</h5>
              <p className="text-xs text-amber-700">
                Decision expected by end of month with potential for 80% agreement probability.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'lead-scoring',
      title: 'AI Lead Scoring',
      snippet: (
        <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 h-full">
          <div className="mb-3 border-b pb-2 flex items-center">
            <h4 className="text-sm font-semibold">Contact: Sarah Williams</h4>
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mr-3">
                <Users size={18} />
              </div>
              <div>
                <div className="font-medium text-sm">Sarah Williams</div>
                <div className="text-xs text-gray-500">CTO, TechCorp Inc</div>
              </div>
            </div>
            <div className="h-14 w-14 rounded-full border-4 border-blue-300 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-700">87</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Engagement</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Fit Score</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Budget Match</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];
  
  // Auto-rotate demo features
  useEffect(() => {
    const rotateFeatures = () => {
      setIsAnimating(true);
      setTimeout(() => {
        const currentIndex = demoFeatures.findIndex(f => f.id === activeFeature);
        const nextIndex = (currentIndex + 1) % demoFeatures.length;
        setActiveFeature(demoFeatures[nextIndex].id);
        setIsAnimating(false);
      }, 500);
    };
    
    const interval = setInterval(rotateFeatures, 6000);
    return () => clearInterval(interval);
  }, [activeFeature, demoFeatures.length]);
  
  return (
    <div className="bg-gradient-to-r from-gray-50 via-indigo-50 to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Experience Our Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how our AI-powered CRM can help you streamline your workflow
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {demoFeatures.map((feature) => (
            <button
              key={feature.id}
              onClick={() => {
                if (activeFeature !== feature.id) {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setActiveFeature(feature.id);
                    setIsAnimating(false);
                  }, 300);
                }
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFeature === feature.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {feature.title}
            </button>
          ))}
        </div>
        
        <div className="max-w-md mx-auto perspective-1000">
          <div className={`relative transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transform-gpu w-full h-[380px]`}>
            {demoFeatures.map(feature => (
              <div 
                key={feature.id}
                className={`absolute inset-0 ${activeFeature === feature.id ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {feature.snippet}
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-10">
          <a href="#" className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
            See all features <ArrowRight size={16} className="ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeatureDemo;
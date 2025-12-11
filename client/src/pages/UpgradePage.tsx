import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Sparkles, Zap, Crown, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';

const UpgradePage = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Get the feature that was blocked (if passed via navigation state)
  const state = location.state as any;
  const requiredFeature = state?.requiredFeature || 'premium features';
  const featureName = state?.featureName || 'this feature';

  // All 7 product tiers with pricing
  const tiers = [
    {
      name: 'SmartCRM',
      tier: 'smartcrm',
      price: '$29/mo',
      icon: Sparkles,
      features: [
        'Dashboard & Analytics',
        'Contacts Management',
        'Sales Pipeline',
        'Calendar & Scheduling',
        'Task Management'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Sales Maximizer',
      tier: 'sales_maximizer',
      price: '$49/mo',
      icon: Zap,
      features: [
        'Everything in SmartCRM',
        'AI Goals & Planning',
        'AI Tools & Automation',
        'Advanced Analytics',
        'Priority Support'
      ],
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'AI Boost Unlimited',
      tier: 'ai_boost_unlimited',
      price: '$69/mo',
      icon: Sparkles,
      features: [
        'Everything in Sales Maximizer',
        'Unlimited AI Credits',
        'Advanced AI Features',
        'No Usage Limits',
        'Premium Support'
      ],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'AI Communication',
      tier: 'ai_communication',
      price: '$79/mo',
      icon: Mail,
      features: [
        'Video Email',
        'SMS & VoIP',
        'Invoicing',
        'Lead Automation',
        'Circle Prospecting',
        'Forms & Surveys'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'SmartCRM Bundle',
      tier: 'smartcrm_bundle',
      price: '$99/mo',
      icon: Crown,
      features: [
        'All Features Included',
        'Full CRM Suite',
        'All Communication Tools',
        'Advanced Automation',
        'Premium Support',
        'Custom Integrations'
      ],
      color: 'from-yellow-500 to-orange-500',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade to Access {featureName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            To access {featureName}, please choose a plan below. 
            All our tiers come with powerful features to supercharge your sales.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                tier.popular ? 'ring-2 ring-yellow-500' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 text-sm font-bold">
                  POPULAR
                </div>
              )}
              
              <div className={`h-2 bg-gradient-to-r ${tier.color}`} />
              
              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl mb-4`}>
                  <tier.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-gray-600 dark:text-gray-300">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full bg-gradient-to-r ${tier.color} text-white hover:opacity-90`}
                  data-testid={`button-upgrade-${tier.tier}`}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Current User Info */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Questions about upgrading? Contact our sales team
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" data-testid="button-back-dashboard">
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              variant="default"
              data-testid="button-contact-sales"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;

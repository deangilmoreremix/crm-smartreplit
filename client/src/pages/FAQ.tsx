import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronDown, ArrowRight, Plus, Minus } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: JSX.Element;
}

const FAQ: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  
  const categories: Category[] = [
    { id: 'general', name: 'General', icon: <div className="w-5 h-5 text-blue-600">?</div> },
    { id: 'ai-features', name: 'AI Features', icon: <div className="w-5 h-5 text-indigo-600">🧠</div> },
    { id: 'pricing', name: 'Pricing & Billing', icon: <div className="w-5 h-5 text-green-600">💲</div> },
    { id: 'setup', name: 'Setup & Configuration', icon: <div className="w-5 h-5 text-amber-600">⚙️</div> },
    { id: 'security', name: 'Security & Privacy', icon: <div className="w-5 h-5 text-red-600">🔒</div> },
    { id: 'integrations', name: 'Integrations', icon: <div className="w-5 h-5 text-purple-600">🔌</div> }
  ];
  
  const faqs: FAQ[] = [
    // General
    {
      id: 'what-is-smart-crm',
      question: 'What is Smart CRM?',
      answer: 'Smart CRM is an AI-powered customer relationship management platform designed to help sales teams work smarter, not harder. It combines traditional CRM functionality with advanced AI capabilities to automate tasks, provide insights, and help you close more deals.',
      category: 'general'
    },
    {
      id: 'who-is-it-for',
      question: 'Who should use Smart CRM?',
      answer: 'Smart CRM is perfect for sales professionals, teams, and organizations of all sizes who want to leverage AI to improve their sales process. It\'s especially valuable for teams that want to reduce administrative work and gain deeper insights into their sales pipeline and customer interactions.',
      category: 'general'
    },
    {
      id: 'getting-started',
      question: 'How do I get started with Smart CRM?',
      answer: 'Getting started is easy! Simply sign up for an account, and you\'ll be guided through a simple onboarding process. You can import your contacts and deals, connect your email, and set up your preferences. The system is designed to be intuitive, but we also offer comprehensive documentation and support to help you get up and running quickly.',
      category: 'general'
    },
    {
      id: 'support-options',
      question: 'What kind of support is available?',
      answer: 'We offer multiple support channels including email support, live chat, knowledge base, video tutorials, and regular webinars. Enterprise plans also include dedicated account management and priority support.',
      category: 'general'
    },
    {
      id: 'mobile-access',
      question: 'Can I use Smart CRM on mobile devices?',
      answer: 'Yes! Smart CRM is fully responsive and works on all devices including smartphones and tablets. We also offer native mobile apps for iOS and Android that provide enhanced functionality and offline access.',
      category: 'general'
    },
    
    // AI Features
    {
      id: 'ai-features-overview',
      question: 'What AI features are included?',
      answer: 'Smart CRM includes a comprehensive suite of AI tools including email analysis, meeting summarization, proposal generation, call script creation, subject line optimization, competitor analysis, market trend analysis, sales forecasting, customer persona generation, voice tone optimization, visual content creation, and much more. We also offer advanced AI capabilities like persistent AI assistants, vision analysis, DALL-E image generation, speech-to-text transcription, semantic search, and function calling.',
      category: 'ai-features'
    },
    {
      id: 'ai-api-keys',
      question: 'Do I need my own API keys for the AI features?',
      answer: 'For the demo version, you\'ll need to provide your own OpenAI and/or Google Gemini API keys in the settings. For production accounts, we handle all API keys and costs as part of your subscription, eliminating the need to manage separate accounts with AI providers.',
      category: 'ai-features'
    },
    {
      id: 'ai-training',
      question: 'Can I train the AI on my company\'s data?',
      answer: 'Yes, you can use the fine-tuning feature to create custom AI models trained specifically on your sales content, objection handling approaches, and communications. This allows the AI to generate more relevant and on-brand content for your specific business.',
      category: 'ai-features'
    },
    {
      id: 'data-security-ai',
      question: 'Is my data secure when using the AI features?',
      answer: 'We take data security extremely seriously. Your data is encrypted both in transit and at rest. When using AI features, data is processed through secure API calls, and we don\'t store your data for AI training purposes without explicit consent. We comply with GDPR, CCPA, and other relevant data protection regulations.',
      category: 'ai-features'
    },
    {
      id: 'ai-limitations',
      question: 'What are the limitations of the AI features?',
      answer: 'While our AI features are powerful, they do have some limitations. AI-generated content should always be reviewed before sending to clients. The AI makes suggestions based on available data and may not account for unique business contexts. Usage limits apply based on your subscription plan to ensure fair use of the system.',
      category: 'ai-features'
    },
    {
      id: 'difference-from-chatgpt',
      question: 'How is this different from using ChatGPT directly?',
      answer: 'Our AI features are deeply integrated with your CRM data, allowing for personalized and contextual assistance. Unlike general AI systems, Smart CRM understands your contacts, deals, communication history, and sales process. It\'s designed specifically for sales use cases with customized models and features like AI deal analysis, lead scoring, and CRM function calling capabilities.',
      category: 'ai-features'
    },
    
    // Pricing
    {
      id: 'pricing-plans',
      question: 'What pricing plans are available?',
      answer: 'We offer flexible pricing plans to suit businesses of all sizes. Our Starter plan is $25/user/month, Professional is $65/user/month, and Enterprise is $125/user/month. All plans include core CRM features, with more advanced AI capabilities available in the higher-tier plans. Annual billing gives you a 20% discount.',
      category: 'pricing'
    },
    {
      id: 'free-trial',
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 14-day free trial with full access to all features in our Professional plan. No credit card is required to start your trial.',
      category: 'pricing'
    },
    {
      id: 'usage-limits',
      question: 'Are there usage limits for AI features?',
      answer: 'Each plan includes a generous allocation of AI credits that reset monthly. Starter includes 100 credits, Professional includes 500 credits, and Enterprise includes 2,000 credits per user. Different AI operations consume varying amounts of credits based on complexity. Additional credits can be purchased if needed.',
      category: 'pricing'
    },
    {
      id: 'payment-methods',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) and PayPal. Enterprise customers can also pay by bank transfer or check.',
      category: 'pricing'
    },
    {
      id: 'refund-policy',
      question: 'What is your refund policy?',
      answer: 'We offer a 30-day money-back guarantee for new subscriptions. If you\'re not satisfied with our service within the first 30 days, contact our support team for a full refund. After 30 days, refunds are prorated based on unused service time.',
      category: 'pricing'
    },
    
    // Setup & Configuration
    {
      id: 'data-import',
      question: 'Can I import my existing data?',
      answer: 'Yes, Smart CRM supports importing contacts, deals, and activities from CSV, Excel, and direct integrations with other popular CRM systems including Salesforce, HubSpot, and Pipedrive. Our import wizard guides you through mapping your existing data to our system.',
      category: 'setup'
    },
    {
      id: 'email-integration',
      question: 'How does email integration work?',
      answer: 'Smart CRM integrates with Gmail, Outlook, and other email providers. You can send and receive emails directly from the platform, track opens and clicks, use email templates, and schedule emails to be sent later. All email communication is automatically logged in contact records.',
      category: 'setup'
    },
    {
      id: 'custom-fields',
      question: 'Can I create custom fields?',
      answer: 'Yes, you can create custom fields for contacts, deals, and other records. This allows you to capture the specific information that matters to your business. Custom fields can be text fields, numbers, dates, dropdowns, checkboxes, and more.',
      category: 'setup'
    },
    {
      id: 'user-permissions',
      question: 'How do user permissions work?',
      answer: 'Smart CRM offers role-based access control, allowing you to define what different users can view or edit. You can create custom roles with specific permissions, and assign users to these roles. Team leaders can be given access to their team\'s data, while restricting access to other teams.',
      category: 'setup'
    },
    {
      id: 'training-resources',
      question: 'What training resources are available?',
      answer: 'We provide a comprehensive knowledge base, video tutorials, webinars, and interactive in-app guidance. New users receive access to our onboarding program which walks through key features and setup steps. Enterprise customers also receive personalized training sessions.',
      category: 'setup'
    },
    
    // Security & Privacy
    {
      id: 'data-security',
      question: 'How secure is my data?',
      answer: 'We employ enterprise-grade security measures including encryption at rest and in transit, regular security audits, and penetration testing. We maintain SOC 2 compliance and follow industry best practices. Our infrastructure is hosted on secure cloud servers with automatic backup systems.',
      category: 'security'
    },
    {
      id: 'gdpr-compliance',
      question: 'Is Smart CRM GDPR compliant?',
      answer: 'Yes, Smart CRM is fully GDPR compliant. We provide tools to help you fulfill GDPR requirements, including data export, deletion capabilities, and consent management. We act as a data processor and provide a Data Processing Agreement (DPA) for customers who require it.',
      category: 'security'
    },
    {
      id: 'data-ownership',
      question: 'Who owns my data?',
      answer: 'You retain full ownership of all your data. We do not sell or share your data with third parties. We only use your data to provide and improve our service to you, as outlined in our Terms of Service and Privacy Policy.',
      category: 'security'
    },
    {
      id: 'access-controls',
      question: 'What access controls are available?',
      answer: 'Smart CRM provides fine-grained access controls, including role-based permissions, IP restrictions, two-factor authentication, single sign-on (SSO) support, and detailed audit logs that track user actions within the system.',
      category: 'security'
    },
    {
      id: 'backup-policy',
      question: 'What is your backup policy?',
      answer: 'We perform automated backups of all data multiple times daily, with both on-site and off-site storage. Backups are encrypted and retained according to configurable retention policies. Enterprise customers can request scheduled data exports for their own storage.',
      category: 'security'
    },
    
    // Integrations
    {
      id: 'available-integrations',
      question: 'What integrations are available?',
      answer: 'Smart CRM integrates with many popular business tools, including email providers (Gmail, Outlook), calendar systems, marketing automation platforms (Mailchimp, HubSpot), accounting software (QuickBooks, Xero), document signing services (DocuSign), telephony systems, and many more via our API and Zapier integration.',
      category: 'integrations'
    },
    {
      id: 'custom-integrations',
      question: 'Can I build custom integrations?',
      answer: 'Yes, we offer a comprehensive API that allows you to build custom integrations with your existing systems. Our API documentation provides detailed guides and examples. Enterprise plans include support for custom integration development.',
      category: 'integrations'
    },
    {
      id: 'zapier-integration',
      question: 'Do you integrate with Zapier?',
      answer: 'Yes, our Zapier integration allows you to connect Smart CRM with thousands of other apps without any coding. You can create automated workflows that trigger based on actions in Smart CRM or update Smart CRM based on activities in other applications.',
      category: 'integrations'
    },
    {
      id: 'microsoft-google-integrations',
      question: 'Does Smart CRM integrate with Microsoft and Google Workspace?',
      answer: 'Yes, we offer deep integrations with both Microsoft 365 (Outlook, Calendar, Teams) and Google Workspace (Gmail, Calendar, Drive). These integrations allow for email sync, calendar management, document storage, and activity tracking.',
      category: 'integrations'
    },
    {
      id: 'calling-integration',
      question: 'Can I make calls directly from Smart CRM?',
      answer: 'Yes, our telephony integration allows you to make and receive calls directly from the CRM. Calls are automatically logged, can be recorded (with proper consent), and transcribed using our AI. We integrate with popular services like Twilio, RingCentral, and more.',
      category: 'integrations'
    }
  ];
  
  // Handle filtering based on search and category
  useEffect(() => {
    let filtered = faqs;
    
    if (searchQuery) {
      filtered = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeCategory) {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }
    
    setFilteredFaqs(filtered);
    
    // Auto-expand all results when searching
    if (searchQuery) {
      const newExpanded: Record<string, boolean> = {};
      filtered.forEach(faq => {
        newExpanded[faq.id] = true;
      });
      setExpandedFaqs(newExpanded);
    } else if (!activeCategory) {
      // Collapse all when no category or search is active
      setExpandedFaqs({});
    }
  }, [searchQuery, activeCategory, faqs]);
  
  const toggleFaq = (id: string) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const selectCategory = (id: string) => {
    if (activeCategory === id) {
      setActiveCategory(null);
    } else {
      setActiveCategory(id);
      
      // Expand first 3 FAQs in this category
      const categoryFaqs = faqs.filter(faq => faq.category === id);
      const newExpanded: Record<string, boolean> = {};
      
      categoryFaqs.slice(0, 3).forEach(faq => {
        newExpanded[faq.id] = true;
      });
      
      setExpandedFaqs(newExpanded);
    }
  };
  
  // Highlight search terms in text
  const highlightSearchTerms = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={i} className="bg-yellow-200 font-medium px-0.5">{part}</span> 
        : part
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Find answers to common questions about Smart CRM, our AI features, pricing, and more.
        </p>
      </div>
      
      {/* Search */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                  !activeCategory && !searchQuery
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="w-5 h-5 text-blue-600 mr-3">🔍</div>
                <span>All Questions</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="mr-3">{category.icon}</div>
                  <span>{category.name}</span>
                  <ChevronRight size={16} className="ml-auto" />
                </button>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h3 className="font-medium text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-sm text-gray-600 mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
              <Link
                to="/contact"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Contact Support <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* FAQ Content */}
        <div className="lg:col-span-3">
          {searchQuery && (
            <div className="mb-6 text-sm text-gray-500">
              Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
          
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">😕</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">We couldn't find any FAQs matching your search.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory(null);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group by category if not searching */}
              {!searchQuery && activeCategory === null ? (
                categories.map(category => {
                  const categoryFaqs = faqs.filter(faq => faq.category === category.id);
                  if (categoryFaqs.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="mb-10">
                      <div className="flex items-center mb-4">
                        <div className="mr-2">{category.icon}</div>
                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                      </div>
                      <div className="space-y-4 ml-1">
                        {categoryFaqs.slice(0, 3).map(faq => (
                          <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <button
                              onClick={() => toggleFaq(faq.id)}
                              className="flex justify-between items-center w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                              {expandedFaqs[faq.id] ? (
                                <Minus size={20} className="text-gray-500 flex-shrink-0" />
                              ) : (
                                <Plus size={20} className="text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            {expandedFaqs[faq.id] && (
                              <div className="p-4 pt-0">
                                <p className="text-gray-700">{faq.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {categoryFaqs.length > 3 && (
                          <div className="pt-2">
                            <button
                              onClick={() => selectCategory(category.id)}
                              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                            >
                              View all {categoryFaqs.length} {category.name.toLowerCase()} questions
                              <ChevronRight size={16} className="ml-1" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show filtered faqs
                filteredFaqs.map(faq => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="flex justify-between items-center w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <h3 className="text-lg font-medium text-gray-900">
                        {searchQuery ? highlightSearchTerms(faq.question) : faq.question}
                      </h3>
                      {expandedFaqs[faq.id] ? (
                        <Minus size={20} className="text-gray-500 flex-shrink-0" />
                      ) : (
                        <Plus size={20} className="text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaqs[faq.id] && (
                      <div className="p-4 pt-0">
                        <p className="text-gray-700">
                          {searchQuery ? highlightSearchTerms(faq.answer) : faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Not finding your answer section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-blue-100 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Not finding what you're looking for?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our support team is ready to answer any questions you may have about Smart CRM.
              We're here to help you get the most out of our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/contact" 
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Contact Support
              </Link>
              <a 
                href="#" 
                className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
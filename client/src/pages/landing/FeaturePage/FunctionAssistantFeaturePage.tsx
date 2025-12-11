import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Zap, 
  Search, 
  Calendar, 
  Database, 
  Briefcase, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play,
  Star,
  Code,
  MessageSquare,
  Users,
  Mail,
  Phone,
  HelpCircle,
  Shield,
  Bot,
  Settings,
  RefreshCw
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const FunctionAssistantFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-yellow-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                AI That <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-600">Takes Action</span> For You
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover our Function-Calling AI Assistant that doesn't just answer questions—it performs real actions in your CRM to save you time and boost productivity.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#features" className="px-8 py-4 bg-white text-amber-600 font-medium rounded-lg border border-amber-200 hover:border-amber-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Features <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required • 14-day free trial
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/30 to-amber-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap size={20} className="text-amber-600 mr-2" />
                      <h3 className="font-semibold">Function Assistant</h3>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="bg-gray-100 rounded-lg p-4 mb-3">
                      <div className="flex items-start">
                        <div className="bg-amber-100 p-1 rounded-full">
                          <Bot size={20} className="text-amber-600" />
                        </div>
                        <div className="ml-3 text-sm text-gray-700">
                          <p>I'm your CRM function assistant. I can help you find information and take actions in your CRM. What would you like to do today?</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-amber-100 rounded-lg p-4 mb-3 ml-auto max-w-[80%]">
                      <p className="text-sm text-gray-800">Find deals that are closing this month</p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-4 mb-3">
                      <div className="flex items-start">
                        <div className="bg-amber-100 p-1 rounded-full">
                          <Bot size={20} className="text-amber-600" />
                        </div>
                        <div className="ml-3 text-sm text-gray-700">
                          <p>I'll search for deals closing this month. Here's what I found:</p>
                          <div className="bg-white rounded p-2 mt-2 border border-gray-200">
                            <p className="font-medium">Deals closing in July 2025:</p>
                            <ul className="mt-1 space-y-1">
                              <li>• Software Renewal (Globex Corp) - $45,000</li>
                              <li>• Annual Subscription (Stark Industries) - $36,000</li>
                              <li>• Implementation Services (Umbrella Corp) - $50,000</li>
                            </ul>
                            <p className="text-xs text-gray-500 mt-2">Total value: $131,000</p>
                          </div>
                          <p className="mt-2">Would you like me to create a follow-up task for any of these deals?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 p-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="w-full p-2 pr-10 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <button className="absolute right-2 top-2 text-amber-600 hover:text-amber-800">
                        <ArrowRight size={20} />
                      </button>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Zap size={14} className="mr-1 text-amber-600" />
                        <span>Function-calling enabled</span>
                      </div>
                      <button className="text-amber-600 hover:text-amber-800">Manage functions</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What The Function Assistant Can Do</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Function Assistant goes beyond conversation to perform actual tasks that save you time and streamline your workflow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Search className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Searching</h3>
              <p className="text-gray-600 mb-4">
                Instantly find contacts and deals matching complex criteria through natural language queries.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                <p><span className="text-amber-800 font-medium">Example:</span> "Find all deals worth over $50,000 in the negotiation stage"</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Task Creation</h3>
              <p className="text-gray-600 mb-4">
                Create follow-up tasks, reminders, and appointments with a simple conversation.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                <p><span className="text-amber-800 font-medium">Example:</span> "Schedule a call with Sarah from ABC Corp next Tuesday at 2pm"</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Database className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Data Updates</h3>
              <p className="text-gray-600 mb-4">
                Update deal statuses, contact information, and other CRM data without clicking through menus.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                <p><span className="text-amber-800 font-medium">Example:</span> "Move the Acme deal to negotiation stage and update the probability to 75%"</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Briefcase className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Deal Analysis</h3>
              <p className="text-gray-600 mb-4">
                Get instant insights and recommendations about your deals and sales pipeline.
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                <p><span className="text-amber-800 font-medium">Example:</span> "Analyze my pipeline and identify deals at risk of stalling"</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 max-w-5xl mx-auto bg-yellow-50 rounded-xl p-8 border border-yellow-100">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-6 md:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">See How It Works</h3>
                <p className="text-gray-600 mb-6">
                  Watch our Function Assistant in action as it performs real tasks in the CRM based on natural conversations.
                </p>
                <button className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                  <Play size={18} className="mr-2" />
                  Watch Demo Video
                </button>
              </div>
              <div className="w-full md:w-1/2 md:pl-8">
                <img 
                  src="https://images.pexels.com/photos/7794382/pexels-photo-7794382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Function Assistant Demo"
                  className="rounded-lg shadow-md border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real-World Applications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how sales teams are using the Function Assistant to streamline their daily workflows.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-amber-600 text-white p-4">
                <h3 className="font-bold text-lg flex items-center">
                  <Users size={20} className="mr-2" />
                  Sales Representative
                </h3>
              </div>
              <div className="p-5">
                <div className="mb-4 font-medium">Common Tasks:</div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Quickly find contact information during client calls</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Create follow-up tasks after meetings without switching screens</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Update deal status and probability while on the go</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Schedule follow-up emails to be sent at optimal times</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-amber-600 text-white p-4">
                <h3 className="font-bold text-lg flex items-center">
                  <Briefcase size={20} className="mr-2" />
                  Sales Manager
                </h3>
              </div>
              <div className="p-5">
                <div className="mb-4 font-medium">Common Tasks:</div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Generate pipeline reports and sales forecasts instantly</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Identify deals needing attention across the entire team</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Reassign tasks and deals between team members</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCheck size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Schedule team meetings with availability checking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Link to="/features" className="inline-flex items-center px-6 py-3 bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
              See All Features <ChevronRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Secure By Design</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built our Function Assistant with enterprise-grade security to protect your sensitive CRM data.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Permission Controls</h3>
              <p className="text-gray-600">
                Granular control over which functions the AI can access and detailed audit logging of all actions taken.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <Code className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Function Validation</h3>
              <p className="text-gray-600">
                All function calls are validated and executed with proper authentication, ensuring only authorized actions.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                <HelpCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Human Confirmation</h3>
              <p className="text-gray-600">
                Optional confirmation workflow for critical operations, letting users review actions before execution.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-white to-yellow-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from sales professionals who've transformed their workflow with our Function Assistant.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "I've cut my CRM data entry time by 75% using the Function Assistant. It's like having a personal assistant who understands exactly what I need."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Alex Thompson" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Alex Thompson</p>
                  <p className="text-gray-500 text-sm">Account Executive, TechSphere</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "The function-calling capability is what sets this CRM apart. I can update deals, schedule meetings, and create tasks all through a simple chat interface."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Maria Rodriguez" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Maria Rodriguez</p>
                  <p className="text-gray-500 text-sm">Sales Manager, Global Solutions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="text-yellow-400 fill-yellow-400" size={18} />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">
                "As someone who was initially skeptical of AI, I'm now completely sold. The Function Assistant has given me back at least 5 hours every week that I can spend on actual selling."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                  <img 
                    src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="David Chen" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">David Chen</p>
                  <p className="text-gray-500 text-sm">Senior Sales Rep, Innovate Inc</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Setup Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Easy to Set Up</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Getting started with the Function Assistant is simple and takes just minutes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute top-0 left-1/2 h-full w-0.5 bg-amber-100 -ml-[1px] z-0 md:hidden"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="font-bold text-lg mb-2 text-center">Enable Functions</h3>
                <p className="text-gray-600 text-center text-sm">
                  Select which CRM functions you want your AI assistant to access.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-0 left-1/2 h-full w-0.5 bg-amber-100 -ml-[1px] z-0 md:hidden"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="font-bold text-lg mb-2 text-center">Customize Settings</h3>
                <p className="text-gray-600 text-center text-sm">
                  Configure permissions, confirmation requirements, and access controls.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="font-bold text-lg mb-2 text-center">Start Using</h3>
                <p className="text-gray-600 text-center text-sm">
                  Begin chatting with your assistant and asking it to perform actions in your CRM.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl shadow-lg overflow-hidden">
              <div className="p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Sales Workflow?</h3>
                <p className="mb-6 opacity-90 text-lg">
                  Join thousands of sales professionals who are saving time and closing more deals with our AI Function Assistant.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/register" className="px-6 py-3 bg-white text-amber-600 font-medium rounded-md hover:bg-gray-100 transition-colors">
                    Start Free Trial
                  </Link>
                  <Link to="/demo" className="px-6 py-3 bg-amber-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-md transition-colors">
                    See Live Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Common Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to frequently asked questions about the Function Assistant.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Is the Function Assistant secure?</h3>
              <p className="text-gray-700">
                Yes, security is our top priority. All functions are executed with proper authentication, permissions are controlled by user roles, and detailed audit logs track every action. You maintain complete control over what the assistant can and cannot do.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">What kind of functions can the assistant perform?</h3>
              <p className="text-gray-700">
                The Function Assistant can search for records, create and update deals, add contacts, schedule tasks and appointments, generate reports, send notifications, and more. The specific functions available depend on your subscription plan.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Can I customize what functions are available?</h3>
              <p className="text-gray-700">
                Absolutely! You have complete control over which functions are enabled and can customize access based on user roles. Enterprise plans also support custom function development for specific business processes.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">How does the assistant know what to do?</h3>
              <p className="text-gray-700">
                The assistant uses advanced natural language processing to understand your requests and translate them into the appropriate function calls. It's trained specifically on CRM terminology and workflows to ensure accuracy.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link to="/faq" className="inline-flex items-center text-amber-600 hover:text-amber-800 font-medium">
              View all FAQs <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default FunctionAssistantFeaturePage;
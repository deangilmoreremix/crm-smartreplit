import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play, 
  Star, 
  PieChart,
  Zap,
  Filter,
  ArrowUpRight,
  CheckCircle,
  Briefcase,
  ChevronDown
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const PipelineFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Visualize and <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Optimize</span> Your Sales Pipeline
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Get a clear view of your entire sales process with customizable pipelines, accurate forecasting, and AI-powered insights.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#features" className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Features <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <img
                  src="https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Sales Pipeline Dashboard"
                  className="relative rounded-xl shadow-2xl border border-gray-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Better Pipeline, Better Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our visual pipeline management tools help you track deals, forecast revenue, and close more business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visual Deal Management</h3>
              <p className="text-gray-600">
                Drag-and-drop interface for moving deals through customized sales stages with complete visibility.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Accurate Sales Forecasting</h3>
              <p className="text-gray-600">
                AI-enhanced forecasting helps you predict revenue with greater accuracy for better planning.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Deal Analytics</h3>
              <p className="text-gray-600">
                Gain insights into deal velocity, conversion rates, and bottlenecks to optimize your sales process.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Visual Pipeline Management */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold ml-3">Visual Pipeline Management</h3>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Get a Clear View of Your Entire Sales Process</h2>
              
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Our customizable Kanban-style pipeline gives you complete visibility into your sales funnel, with powerful tools to track and manage deals at every stage.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Customizable Sales Stages</h4>
                    <p className="text-gray-600">Create pipelines that match your unique sales process and workflow.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Drag-and-Drop Simplicity</h4>
                    <p className="text-gray-600">Move deals between stages with simple drag-and-drop actions.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Updates</h4>
                    <p className="text-gray-600">See changes and updates from your team instantly as they happen.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Deal Priority Indicators</h4>
                    <p className="text-gray-600">Easily identify which deals need immediate attention.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Link to="/features/pipeline/visual-management" className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors mr-4">
                  Learn More
                </Link>
                <button className="flex items-center text-blue-600 font-medium">
                  <Play size={16} className="mr-2" fill="currentColor" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl blur-xl opacity-30"></div>
                <img
                  src="https://images.pexels.com/photos/8370380/pexels-photo-8370380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="Pipeline Management"
                  className="relative rounded-xl shadow-xl border border-gray-200 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Sales Forecasting Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <PieChart className="h-5 w-5 text-purple-600 mr-2" />
                    <h3 className="font-semibold">Sales Forecast</h3>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-gray-900">Q3 2023 Forecast</h4>
                    <div className="flex items-center">
                      <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-l-md">Monthly</button>
                      <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm">Quarterly</button>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-700 mb-1">Pipeline</p>
                        <p className="text-xl font-bold text-purple-900">$846,500</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-700 mb-1">Committed</p>
                        <p className="text-xl font-bold text-blue-900">$412,000</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-700 mb-1">Closed</p>
                        <p className="text-xl font-bold text-green-900">$192,500</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">AI Forecast Analysis</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <p><strong>28% increase</strong> in pipeline value compared to last quarter</p>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <p><strong>$380K likely to close</strong> based on deal progression patterns</p>
                      </div>
                      <div className="flex items-start">
                        <Filter className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                        <p><strong>Focus on Enterprise Licensing deals</strong> for highest close probability</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Generate Detailed Report
                  </button>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold ml-3">AI Sales Forecasting</h3>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Predict Revenue with Confidence</h2>
              
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Our AI-powered forecasting helps you predict future revenue with greater accuracy, so you can plan and make better business decisions.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Machine Learning Prediction</h4>
                    <p className="text-gray-600">AI algorithms analyze historical data to predict future sales with high accuracy.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Probability-Weighted Forecasts</h4>
                    <p className="text-gray-600">Get realistic forecasts based on each deal's probability of closing.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Scenario Planning</h4>
                    <p className="text-gray-600">Model different scenarios to understand potential outcomes and risks.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCheck className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Trend Analysis</h4>
                    <p className="text-gray-600">Identify patterns and trends to improve your sales strategy.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Link to="/features/pipeline/forecasting" className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors mr-4">
                  Learn More
                </Link>
                <button className="flex items-center text-purple-600 font-medium">
                  <Play size={16} className="mr-2" fill="currentColor" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Deal Analytics Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Deal Analytics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get deeper insights into your deals and sales performance to continuously improve your results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold ml-2">Performance Metrics</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Track key metrics like win rates, average deal size, sales cycle length, and conversion rates between stages.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-700 mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-indigo-900">36%</p>
                  <p className="text-xs text-green-600 flex items-center justify-center">
                    <ArrowUpRight size={12} className="mr-0.5" /> 5% vs. last month
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-700 mb-1">Avg. Deal Size</p>
                  <p className="text-2xl font-bold text-indigo-900">$42K</p>
                  <p className="text-xs text-green-600 flex items-center justify-center">
                    <ArrowUpRight size={12} className="mr-0.5" /> 12% vs. last month
                  </p>
                </div>
              </div>
              <Link to="/features/pipeline/analytics" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Briefcase className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold ml-2">Deal Health Monitoring</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Automatically identify deals at risk and get AI-powered recommendations to keep deals moving forward.
              </p>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-4">
                <h4 className="font-medium text-amber-800 mb-2">Deal Risk Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Enterprise Solution ($85K)</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">High Risk</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Renewal Contract ($54K)</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Medium Risk</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Professional Services ($32K)</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Low Risk</span>
                  </div>
                </div>
              </div>
              <Link to="/features/pipeline/deal-health" className="text-amber-600 hover:text-amber-800 font-medium flex items-center">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl p-8 text-white relative">
                <div className="absolute -top-4 -left-4 text-blue-600 text-6xl opacity-20">"</div>
                <p className="text-xl mb-6 relative z-10">
                  Smart CRM's pipeline management has transformed how we track and close deals. The visual interface makes it easy to see exactly where every opportunity stands, and the AI forecasting has improved our revenue predictions by 26%.
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Testimonial" 
                    className="h-16 w-16 rounded-full mr-4 object-cover border-2 border-white"
                  />
                  <div>
                    <p className="font-semibold">David Wilson</p>
                    <p className="opacity-80 text-sm">Sales Director, Quantum Technologies</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 text-blue-600 text-6xl opacity-20">"</div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Real Results from Real Companies</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-green-100 text-green-600 mr-4">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">42% Increase</h3>
                    <p className="text-gray-600">in sales forecast accuracy</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">28% Higher</h3>
                    <p className="text-gray-600">win rate for deals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">35% Shorter</h3>
                    <p className="text-gray-600">sales cycle length</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">3.5x</h3>
                    <p className="text-gray-600">return on investment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Sales Pipeline?</h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of sales teams using Smart CRM to visualize, manage, and optimize their sales pipeline.
            </p>
            <Link to="/register" className="px-8 py-4 bg-white text-blue-700 font-medium rounded-lg hover:shadow-lg transition duration-300 inline-block">
              Start Your Free Trial
            </Link>
            <p className="mt-4 opacity-80">No credit card required</p>
          </div>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default PipelineFeaturePage;
import React from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Eye, 
  Image, 
  FileText, 
  FileSearch, 
  ChevronRight, 
  CheckCheck, 
  ArrowRight, 
  Play,
  Star,
  Zap,
  PieChart,
  BarChart3,
  CheckSquare,
  Search,
  Code,
  User,
  Check,
  PlusCircle
} from 'lucide-react';

import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const VisionAnalyzerFeaturePage: React.FC = () => {
  return (
    <div className="bg-white">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="relative pt-20 bg-gradient-to-b from-white to-cyan-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">Visual Intelligence</span> For Your Sales Process
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Extract valuable insights from images, documents, and visual content. Analyze competitor materials, understand customer documents, and leverage visual data for your sales strategy.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition duration-300">
                  Start Free Trial
                </Link>
                <HashLink to="#use-cases" className="px-8 py-4 bg-white text-cyan-600 font-medium rounded-lg border border-cyan-200 hover:border-cyan-300 hover:shadow-md transition duration-300 flex items-center">
                  Explore Use Cases <ChevronRight size={18} className="ml-1" />
                </HashLink>
              </div>
              <div className="mt-8 flex items-center text-sm text-gray-500">
                <CheckCheck size={18} className="text-green-500 mr-2" />
                No credit card required
              </div>
            </div>
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye size={20} className="text-cyan-600 mr-2" />
                      <h3 className="font-semibold">Vision Analyzer</h3>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <Image size={40} className="text-gray-400 mb-3" />
                        <p className="text-gray-500 text-center mb-2">Drop an image or document here, or click to browse</p>
                        <p className="text-xs text-gray-400 text-center">Supports PNG, JPG, PDF, and more</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Analysis Type
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                        <option>General Analysis</option>
                        <option>Competitor Material Analysis</option>
                        <option>Document Extraction</option>
                        <option>Product Comparison</option>
                      </select>
                    </div>
                    
                    <button className="w-full p-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-colors flex items-center justify-center">
                      <Eye size={18} className="mr-2" />
                      Analyze Visual Content
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Key Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See What Others Miss</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Vision Analyzer transforms visual content into actionable sales intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                <Zap className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Analysis</h3>
              <p className="text-gray-600">
                Extract valuable information from images and documents in seconds, saving hours of manual review and analysis.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <FileSearch className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Competitive Intelligence</h3>
              <p className="text-gray-600">
                Analyze competitor materials, presentations, and visuals to extract strategic insights for better positioning.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Document Understanding</h3>
              <p className="text-gray-600">
                Quickly process client documents, RFPs, contracts, and presentations to identify key information and requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 bg-gradient-to-b from-cyan-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Use Cases</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the many ways sales teams are leveraging vision analysis to gain an edge.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Competitor Analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Competitor Analysis</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Upload competitor marketing materials, presentations, or product images to identify positioning, feature sets, and messaging strategy.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Key messaging focuses on "enterprise scalability"</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Missing critical security features you offer</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Targeting financial services industry primarily</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6476250/pexels-photo-6476250.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="RFP and Document Analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">RFP and Document Analysis</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Extract key requirements, deadlines, and evaluation criteria from complex RFPs, SOWs, and procurement documents.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Submission deadline: August 15, 2025</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Key requirement: ISO 27001 compliance</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Decision makers: CTO and Procurement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7712474/pexels-photo-7712474.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Business Card & Contact Info"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Business Card & Contact Info</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Instantly digitize business cards and contact information from photos or scanned documents into your CRM.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Extracted complete contact details</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Added LinkedIn URL from card QR code</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Detected industry from company logo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6476589/pexels-photo-6476589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Sales Presentation Analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Sales Presentation Analysis</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Analyze images of client-side presentations to capture whiteboard notes, discussion points, and requirements.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Captured whiteboard diagrams showing workflow</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Identified 3 critical pain points from slides</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Extracted projected timeline and milestones</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7654586/pexels-photo-7654586.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Market Research Images"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Market Research Images</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Extract insights from market research visuals, charts, and graphs to inform your sales strategy and messaging.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Market size projected to grow 32% by 2026</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Identified emerging customer segment in healthcare</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Key trend: Increased focus on security compliance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/5961152/pexels-photo-5961152.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Contract Analysis"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Contract Analysis</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Quickly analyze contracts and agreements to extract key terms, obligations, and potential risks or opportunities.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">Example Insights:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Contract term: 36 months with auto-renewal</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Early termination penalties identified</span>
                    </li>
                    <li className="flex items-start">
                      <Check size={14} className="text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      <span>Upsell opportunity in Section 5.2</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/features/vision-analyzer/gallery" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-md transition-colors">
              View More Use Cases <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powered by Advanced AI</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Vision Analyzer is built on cutting-edge computer vision and natural language processing technologies.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center max-w-5xl mx-auto">
            <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-8 md:mb-0">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-90 flex items-center justify-center">
                  <Play size={64} fill="white" stroke="none" />
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="p-2 bg-cyan-100 rounded-full text-cyan-600 mr-3 mt-0.5">
                    <Code size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">GPT-4 Vision Integration</h3>
                    <p className="text-sm text-gray-600">
                      Leverages OpenAI's advanced multimodal model to understand and analyze visual content with human-like comprehension.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 bg-cyan-100 rounded-full text-cyan-600 mr-3 mt-0.5">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">OCR Technology</h3>
                    <p className="text-sm text-gray-600">
                      Advanced optical character recognition extracts text from images and documents with high accuracy, even with complex layouts.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 bg-cyan-100 rounded-full text-cyan-600 mr-3 mt-0.5">
                    <PieChart size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Chart & Graph Analysis</h3>
                    <p className="text-sm text-gray-600">
                      Specialized algorithms for analyzing visual data representations, extracting trends, values, and insights from charts.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="p-2 bg-cyan-100 rounded-full text-cyan-600 mr-3 mt-0.5">
                    <Search size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Visual Search</h3>
                    <p className="text-sm text-gray-600">
                      Find similar images and visuals across your CRM database, making visual content discoverable and reusable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Example Results Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Example Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See the type of insights our Vision Analyzer produces from different types of visual content.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6476250/pexels-photo-6476250.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Document Analysis Example"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Technical RFP Document</h3>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-3">Analysis Results:</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Key Requirements:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>99.9% uptime SLA requirement</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>SOC 2 Type II compliance mandatory</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>API integration with SAP required</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timeline & Deadlines:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>RFP submission due: August 15, 2025</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Implementation deadline: Q4 2025</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Decision Criteria:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Technical capability (40%)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Price (30%)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Support & implementation (20%)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>References (10%)</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-1" />
                    Add to Deal Notes
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6476647/pexels-photo-6476647.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Competitor Analysis Example"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Competitor Website Screenshot</h3>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-3">Analysis Results:</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Key Features Highlighted:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>AI analytics and reporting</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Enterprise integration capabilities</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Advanced security compliance</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pricing Structure:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Three-tiered pricing model (Basic, Pro, Enterprise)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Pro tier priced at $79/user/month</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Competitive Advantages:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-red-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Missing mobile app offering (your advantage)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-red-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>No mention of 24/7 support (your advantage)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Emphasizes industry awards (their advantage)</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-1" />
                    Save to Competitor Intelligence
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/6476585/pexels-photo-6476585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Chart Analysis Example"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Market Trend Chart</h3>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-3">Analysis Results:</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Key Trends:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Market growing at 18% CAGR through 2025</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Enterprise segment showing highest growth (32%)</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Market saturation in SMB space (only 5% growth)</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Opportunity Areas:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Healthcare vertical shows 27% growth potential</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>International markets underpenetrated</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Extracted Data Points:</p>
                    <div className="mt-1 text-sm">
                      <p>Market Size (2024): $8.3B</p>
                      <p>Projected Size (2028): $14.7B</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-1" />
                    Save to Market Research
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-64 bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Whiteboard Notes"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                  <h3 className="text-white font-bold text-lg">Client Whiteboard Session</h3>
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-3">Analysis Results:</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Client Pain Points:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Data silos between departments</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Manual reporting taking 20+ hours/week</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Legacy system integration challenges</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project Timeline:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Planning phase: Q3 2025</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Implementation target: Q4 2025</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Decision Makers:</p>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li className="flex items-start">
                        <User size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Sarah (CTO) - Technical approval</span>
                      </li>
                      <li className="flex items-start">
                        <User size={14} className="text-cyan-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Michael (CFO) - Budget approval</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-1" />
                    Create Meeting Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Success Stories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from sales teams who have transformed their process with Vision Analyzer.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/3 mb-6 md:mb-0 md:pr-8">
                  <img 
                    src="https://images.pexels.com/photos/5324954/pexels-photo-5324954.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Success Story" 
                    className="rounded-xl shadow-md w-full"
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className="text-yellow-400 fill-yellow-400" size={20} />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 italic mb-4">
                    "The Vision Analyzer has been a revelation for our RFP response process. We used to spend days manually reviewing complex RFPs to extract requirements. Now we upload the document, get a complete analysis in minutes, and never miss critical details. It's increased our win rate by 28% by ensuring we address all requirements precisely."
                  </blockquote>
                  <div>
                    <p className="font-semibold text-gray-900">Jennifer Chen</p>
                    <p className="text-gray-500">VP of Sales, Enterprise Solutions Inc.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <p className="text-gray-700 italic mb-4">
                  "Being able to instantly analyze a competitor's marketing materials gives us a huge advantage in positioning our product. We identified a gap in their feature set that we could exploit in our pitch."
                </p>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                      alt="User" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Mark Johnson</p>
                    <p className="text-gray-500 text-sm">Sales Director</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <p className="text-gray-700 italic mb-4">
                  "The chart analysis feature is so powerful. I took a photo of a market trend slide during a client presentation, and immediately got insights about growing segments we should target."
                </p>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      src="https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                      alt="User" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Rebecca Wilson</p>
                    <p className="text-gray-500 text-sm">Account Executive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Seamlessly Integrated</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vision Analyzer integrates deeply with your CRM workflow to enhance your sales process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-3">
                  <User size={20} />
                </div>
                <h3 className="font-bold text-lg">Contact Records</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Scan business cards and documents to automatically create or update contact records with extracted information.
              </p>
              <div className="bg-cyan-50 p-2 rounded-md text-xs text-cyan-700">
                Saves an average of 2 minutes per contact
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <BarChart3 size={20} />
                </div>
                <h3 className="font-bold text-lg">Deal Intelligence</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Attach visual analyses to deals for enhanced insights, competitive intelligence, and requirements tracking.
              </p>
              <div className="bg-blue-50 p-2 rounded-md text-xs text-blue-700">
                28% higher win rate with visual intelligence
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                  <CheckSquare size={20} />
                </div>
                <h3 className="font-bold text-lg">Task Creation</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Automatically generate tasks and action items from analyzed documents and visual content.
              </p>
              <div className="bg-purple-50 p-2 rounded-md text-xs text-purple-700">
                Reduces follow-up task creation time by 75%
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            See What You've Been Missing
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join thousands of sales professionals who are using Vision Analyzer to gain competitive insights and close more deals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-white text-cyan-700 font-medium rounded-lg hover:shadow-lg transition duration-300">
              Start Your Free Trial
            </Link>
            <Link to="/features" className="px-8 py-4 bg-cyan-500 bg-opacity-30 hover:bg-opacity-40 text-white font-medium rounded-lg transition-colors">
              Explore All Features
            </Link>
          </div>
          <p className="mt-4 opacity-80">No credit card required</p>
        </div>
      </section>
      
      <LandingFooter />
    </div>
  );
};

export default VisionAnalyzerFeaturePage;
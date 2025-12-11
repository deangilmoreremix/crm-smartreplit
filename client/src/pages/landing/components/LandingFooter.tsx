import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  ArrowRight
} from 'lucide-react';
import { useWhitelabel } from '../../../contexts/WhitelabelContext';

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  const { config } = useWhitelabel();
  
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 text-2xl font-bold mb-6">
              {config.logoUrl && (
                <img
                  src={config.logoUrl}
                  alt={`${config.companyName || 'Company'} Logo`}
                  className="h-8 w-8 object-contain"
                />
              )}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                {config.companyName || 'Smart'}<span className="text-white">{config.companyName ? 'CRM' : 'CRM'}</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              The all-in-one sales platform that combines powerful CRM capabilities with AI-driven insights to transform your sales process.
            </p>
            <div className="space-y-2">
              {config.supportEmail && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-400 mr-3" />
                  <span className="text-gray-300">{config.supportEmail}</span>
                </div>
              )}
              {config.supportPhone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-blue-400 mr-3" />
                  <span className="text-gray-300">{config.supportPhone}</span>
                </div>
              )}
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-gray-300">contact@{config.companyName ? config.companyName.toLowerCase().replace(/\s+/g, '') : 'smartcrm'}.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-gray-300">123 Sales Street, San Francisco, CA 94103</span>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Features</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features/ai-tools" className="text-gray-400 hover:text-blue-400 transition-colors">
                  AI Sales Tools
                </Link>
              </li>
              <li>
                <Link to="/features/contacts" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contact Management
                </Link>
              </li>
              <li>
                <Link to="/features/pipeline" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Deal Pipeline
                </Link>
              </li>
              <li>
                <Link to="/features/analytics" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/help" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-gray-400 hover:text-blue-400 transition-colors">
                  System Status
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 pt-12 mt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
              <p className="text-gray-400">Get the latest updates on new features and product releases.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 min-w-[280px]"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-md transition duration-300 flex items-center justify-center">
                Subscribe
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} {config.companyName || 'SmartCRM'}. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-8">
            <Link to="/legal/privacy" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/legal/terms" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/legal/cookies" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
              Cookie Policy
            </Link>
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <Twitter size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <Facebook size={20} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <Instagram size={20} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
              <Youtube size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
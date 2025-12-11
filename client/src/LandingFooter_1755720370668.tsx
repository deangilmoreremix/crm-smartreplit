import React from 'react';
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

const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-2xl font-bold mb-6 inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Smart<span className="text-white">CRM</span>
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              The all-in-one sales platform that combines powerful CRM capabilities with AI-driven insights to transform your sales process.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-gray-300">contact@smartcrm.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-gray-300">(555) 123-4567</span>
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
                <Link to="/features/communications" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Communication Tools
                </Link>
              </li>
              <li>
                <Link to="/features/automation" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Sales Automation
                </Link>
              </li>
              <li>
                <Link to="/features/appointments" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Appointment Scheduling
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
                <Link to="/contact" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Blog
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
                <Link to="/partners" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <HashLink to="/#pricing" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Pricing
                </HashLink>
              </li>
              <li>
                <Link to="/resources/documentation" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/resources/guides" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link to="/resources/api" className="text-gray-400 hover:text-blue-400 transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link to="/resources/webinars" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Webinars
                </Link>
              </li>
              <li>
                <Link to="/resources/community" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter */}
        <div className="border-t border-gray-800 mt-12 pt-8 pb-6">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-xl font-bold mb-3 text-white">Subscribe to Our Newsletter</h3>
            <p className="text-gray-400 mb-6">
              Get the latest tips, updates, and resources to boost your sales performance.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-l-md text-gray-900 focus:outline-none sm:rounded-r-none"
              />
              <button className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-md sm:rounded-l-none font-medium flex items-center justify-center">
                Subscribe <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} SmartCRM. All rights reserved.
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
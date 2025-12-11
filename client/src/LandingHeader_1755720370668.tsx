import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Menu, X, ChevronDown } from 'lucide-react';

const LandingHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  
  // Track scroll position to change header style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-gray-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Smart<span className="text-gray-900">CRM</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <div className="relative">
              <button 
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setFeaturesOpen(!featuresOpen)}
                onBlur={() => setTimeout(() => setFeaturesOpen(false), 200)}
              >
                Features <ChevronDown size={16} className={`ml-1 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {featuresOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 p-4 w-[580px] z-10">
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/features/ai-tools" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      AI Sales Tools
                    </Link>
                    <Link to="/features/contacts" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Contact Management
                    </Link>
                    <Link to="/features/pipeline" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Deal Pipeline
                    </Link>
                    <Link to="/features/ai-assistant" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      AI Assistant
                    </Link>
                    <Link to="/features/vision-analyzer" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Vision Analyzer
                    </Link>
                    <Link to="/features/image-generator" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Image Generator
                    </Link>
                    <Link to="/features/function-assistant" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Function Assistant
                    </Link>
                    <Link to="/features/speech-to-text" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Speech to Text
                    </Link>
                    <Link to="/features/semantic-search" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Semantic Search
                    </Link>
                    <Link to="/features/communications" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Communication Tools
                    </Link>
                    <Link to="/features/automation" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Sales Automation
                    </Link>
                    <Link to="/features/appointments" className="p-2 hover:bg-gray-50 rounded-md text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                      Appointment Scheduling
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <HashLink to="/#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
              Pricing
            </HashLink>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About Us
            </Link>
            <Link to="/faq" className="text-gray-700 hover:text-blue-600 transition-colors">
              FAQ
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
              Log In
            </Link>
            <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-md transition duration-300">
              Sign Up
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-gray-700 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white shadow-lg p-4 mt-3">
          <nav className="flex flex-col space-y-4">
            <div className="py-2 border-b border-gray-100">
              <button 
                className="flex items-center text-gray-700 w-full text-left"
                onClick={() => setFeaturesOpen(!featuresOpen)}
              >
                Features <ChevronDown size={16} className={`ml-2 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {featuresOpen && (
                <div className="mt-2 ml-4 space-y-2">
                  <Link to="/features/ai-tools" className="block py-1 text-gray-600 hover:text-blue-600">
                    AI Sales Tools
                  </Link>
                  <Link to="/features/contacts" className="block py-1 text-gray-600 hover:text-blue-600">
                    Contact Management
                  </Link>
                  <Link to="/features/pipeline" className="block py-1 text-gray-600 hover:text-blue-600">
                    Deal Pipeline
                  </Link>
                  <Link to="/features/ai-assistant" className="block py-1 text-gray-600 hover:text-blue-600">
                    AI Assistant
                  </Link>
                  <Link to="/features/vision-analyzer" className="block py-1 text-gray-600 hover:text-blue-600">
                    Vision Analyzer
                  </Link>
                  <Link to="/features/image-generator" className="block py-1 text-gray-600 hover:text-blue-600">
                    Image Generator
                  </Link>
                  <Link to="/features/function-assistant" className="block py-1 text-gray-600 hover:text-blue-600">
                    Function Assistant
                  </Link>
                  <Link to="/features/speech-to-text" className="block py-1 text-gray-600 hover:text-blue-600">
                    Speech to Text
                  </Link>
                  <Link to="/features/semantic-search" className="block py-1 text-gray-600 hover:text-blue-600">
                    Semantic Search
                  </Link>
                  <Link to="/features/communications" className="block py-1 text-gray-600 hover:text-blue-600">
                    Communication Tools
                  </Link>
                  <Link to="/features/automation" className="block py-1 text-gray-600 hover:text-blue-600">
                    Sales Automation
                  </Link>
                  <Link to="/features/appointments" className="block py-1 text-gray-600 hover:text-blue-600">
                    Appointment Scheduling
                  </Link>
                </div>
              )}
            </div>
            <HashLink to="/#pricing" className="text-gray-700">
              Pricing
            </HashLink>
            <Link to="/about" className="text-gray-700">
              About Us
            </Link>
            <Link to="/faq" className="text-gray-700">
              FAQ
            </Link>
            <Link to="/contact" className="text-gray-700">
              Contact
            </Link>
            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col space-y-3">
              <Link to="/login" className="px-4 py-2 text-center border border-gray-300 rounded-lg text-gray-700">
                Log In
              </Link>
              <Link to="/register" className="px-4 py-2 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg">
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
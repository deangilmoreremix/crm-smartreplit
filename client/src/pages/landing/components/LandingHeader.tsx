import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useWhitelabel } from '../../../contexts/WhitelabelContext';

const LandingHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  
  // Debug logging
  console.log('LandingHeader component rendering');
  
  // Temporarily bypass the useWhitelabel hook to test if it's causing issues
  let config: any;
  try {
    config = useWhitelabel().config;
    console.log('WhitelabelContext working, config:', config);
  } catch (error) {
    console.error('WhitelabelContext error:', error);
    config = { companyName: 'Smart', logoUrl: null };
  }
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
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
      }`}
      data-testid="landing-header"
      style={{ display: 'block', visibility: 'visible' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 text-2xl font-bold text-gray-900" data-testid="logo-link">
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt={`${config.companyName || 'Company'} Logo`}
                className="h-8 w-8 object-contain"
              />
            )}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {config.companyName || 'Smart'}<span className="text-gray-900">{config.companyName ? 'CRM' : 'CRM'}</span>
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
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 p-4 w-[580px] z-[100]">
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
                  </div>
                </div>
              )}
            </div>

            <HashLink smooth to="/#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">
              Pricing
            </HashLink>
            <Link to="/voice-profiles" className="text-gray-700 hover:text-blue-600 transition-colors">
              Voice Profiles
            </Link>
            <HashLink smooth to="/#faq" className="text-gray-700 hover:text-blue-600 transition-colors">
              FAQ
            </HashLink>
            <Link to="/signin" className="text-gray-700 hover:text-blue-600 transition-colors">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white shadow-lg p-4 mt-3">
          {/* Mobile Logo */}
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-100 mb-4">
            {config.logoUrl && (
              <img
                src={config.logoUrl}
                alt={`${config.companyName || 'Company'} Logo`}
                className="h-6 w-6 object-contain"
              />
            )}
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {config.companyName || 'Smart'}<span className="text-gray-900">{config.companyName ? 'CRM' : 'CRM'}</span>
            </span>
          </div>

          <nav className="flex flex-col space-y-4">
            <Link to="/features/ai-tools" className="text-gray-700 hover:text-blue-600 transition-colors py-2">
              AI Sales Tools
            </Link>
            <Link to="/features/contacts" className="text-gray-700 hover:text-blue-600 transition-colors py-2">
              Contact Management
            </Link>
            <Link to="/features/pipeline" className="text-gray-700 hover:text-blue-600 transition-colors py-2">
              Deal Pipeline
            </Link>
            <Link to="/signin" className="text-gray-700 hover:text-blue-600 transition-colors py-2">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg w-fit"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRight, CheckCircle, Star, Users, Zap, TrendingUp } from 'lucide-react';

const SalesLandingPage: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Powered Automation",
      description: "Automate your sales process with intelligent AI assistants"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Smart Contact Management",
      description: "Organize and track all your leads and customers in one place"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Get insights into your sales performance and pipeline health"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechCorp",
      rating: 5,
      text: "This CRM has transformed our sales process completely."
    },
    {
      name: "Mike Chen",
      company: "StartupXYZ",
      rating: 5,
      text: "The AI features save us hours every day."
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} py-4`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold">SmartCRM</div>
          <div className="space-x-4">
            <Link
              to="/signin"
              className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            The AI-Powered CRM That Grows Your Business
          </h1>
          <p className={`text-xl mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Streamline your sales process, manage contacts intelligently, and close more deals with our advanced AI-powered CRM platform.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 inline-flex items-center"
            >
              Try It Free <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/demo')}
              className={`px-8 py-4 border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:border-gray-500' : 'border-gray-300 text-gray-700 hover:border-gray-400'} rounded-lg text-lg font-semibold`}
            >
              Watch Demo
            </button>
          </div>
          
          {/* Interactive Demo Buttons */}
          <div className="mt-8 text-center">
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Or try our interactive demos:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/demo/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                📊 Dashboard Demo
              </button>
              <button
                onClick={() => navigate('/demo/contacts')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
              >
                👥 Contacts Demo
              </button>
              <button
                onClick={() => navigate('/demo/pipeline')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                🎯 Pipeline Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`p-6 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg`}>
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 px-6 ${isDark ? 'bg-blue-900' : 'bg-blue-600'} text-white`}>
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using SmartCRM to grow their revenue.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-flex items-center"
          >
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white`}>
        <div className="container mx-auto text-center">
          <div className="text-2xl font-bold mb-4">SmartCRM</div>
          <p className="opacity-70">© 2024 SmartCRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SalesLandingPage;
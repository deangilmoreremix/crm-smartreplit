
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HashLink } from 'react-router-hash-link';
import {
  Brain,
  Mail,
  MessageSquare,
  FileText,
  Phone,
  Target,
  FileSearch,
  TrendingUp,
  BarChart3,
  PieChart,
  ChevronRight,
  CheckCheck,
  ArrowRight,
  Play,
  User,
  Clock,
  Star,
  ExternalLink,
  BarChart,
  Users,
  Briefcase,
  Eye,
  Image,
  Mic,
  Search,
  Zap,
  Calendar
} from 'lucide-react';

import LandingHeader from './landing/components/LandingHeader';
import LandingFooter from './landing/components/LandingFooter';
import PricingCard from './landing/components/PricingCard';
import FeatureCard from './landing/components/FeatureCard';
import TestimonialCard from './landing/components/TestimonialCard';
import AnimatedFeatureIcon from '../components/landing/AnimatedFeatureIcon';
import FloatingIcons from '../components/landing/FloatingIcons';
import ProductDemo from '../components/landing/ProductDemo';
import ClientLogos from '../components/landing/ClientLogos';
import StatCounter from '../components/landing/StatCounter';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import ParallaxHero from '../components/landing/ParallaxHero';
import ScrollAnimationWrapper from '../components/landing/ScrollAnimationWrapper';
import FeatureDemo from '../components/landing/FeatureDemo';
import InteractiveFeaturesGrid from '../components/landing/InteractiveFeaturesGrid';
import ParticleBackground from '../components/landing/ParticleBackground';

// Import the embedded dashboard demo
import EmbeddedDashboardDemo from '../components/landing/EmbeddedDashboardDemo';
import VideoCallDemo from '../components/landing/VideoCallDemo';

// Import DevBypassButton
import { DevBypassButton } from '../components/DevBypassButton';

const LandingPage = () => {
  const navigate = useNavigate();

  // Function to handle page initialization only once
  useEffect(() => {
    const preloadHighPriorityAssets = () => {
      // Preload critical images
      const criticalImages = [
        'https://images.pexels.com/photos/6476582/pexels-photo-6476582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      ];

      if (typeof window !== 'undefined') {
        criticalImages.forEach(url => {
          const img = new window.Image();
          img.src = url;
        });
      }
    };

    // Call the preload function
    preloadHighPriorityAssets();
  }, []);  // Empty dependency array ensures this only runs once
  
  return (
    <>
      {/* Dev Bypass Button for testing */}
      <DevBypassButton />
      <div className="bg-white content-stable">
        <LandingHeader />
      
      {/* Main Content Area */}
      <main className="landing-content">
        {/* Hero Section */}
        <section className="landing-section">
          <ParallaxHero />
        </section>
        
        {/* Client logos */}
        <section className="landing-section">
          <ClientLogos />
        </section>
        
        {/* Feature Demo Section with interactive components */}
        <section className="landing-section">
          <FeatureDemo />
        </section>
        
        {/* Interactive Features Grid */}
        <section className="landing-section">
          <ScrollAnimationWrapper animation="fade-up">
            <InteractiveFeaturesGrid />
          </ScrollAnimationWrapper>
        </section>
      
      {/* Stats Counter Section */}
        <section className="landing-section py-16 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
        <ParticleBackground particleCount={30} />
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-in">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Impact of Smart CRM</h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Real results from businesses using our AI-powered CRM platform
              </p>
            </div>
          </ScrollAnimationWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <ScrollAnimationWrapper animation="fade-up" delay={100}>
              <StatCounter 
                icon={<TrendingUp size={24} />} 
                label="Sales Growth" 
                value={32} 
                suffix="%" 
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={200}>
              <StatCounter 
                icon={<Clock size={24} />} 
                label="Hours Saved Weekly" 
                value={9.5} 
                decimals={1} 
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={300}>
              <StatCounter 
                icon={<BarChart size={24} />} 
                label="Lead Conversion" 
                value={24} 
                suffix="%" 
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={400}>
              <StatCounter 
                icon={<Users size={24} />} 
                label="Happy Customers" 
                value={5000} 
                suffix="+" 
              />
            </ScrollAnimationWrapper>
          </div>
        </div>
      </section>
      
      {/* Interactive Dashboard Demo Section */}
        <section className="landing-section py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Experience Your CRM Dashboard</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Try our fully interactive dashboard demo with real-time data and AI-powered insights
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <EmbeddedDashboardDemo />
            </div>
          </ScrollAnimationWrapper>
        </div>
        
        {/* Background floating elements */}
        <div className="absolute top-10 right-10 opacity-20">
          <AnimatedFeatureIcon
            icon={<Brain size={30} />}
            color="bg-indigo-100"
            delay={0}
            size="lg"
          />
        </div>
        <div className="absolute bottom-20 left-10 opacity-20">
          <AnimatedFeatureIcon
            icon={<BarChart3 size={30} />}
            color="bg-blue-100"
            delay={1}
            size="lg"
          />
        </div>
      </section>
      
      {/* Video Call Demo Section */}
      <section className="landing-section py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Integrated Video Calling</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect with clients and team members through built-in HD video calls with AI-powered features
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <VideoCallDemo />
            </div>
          </ScrollAnimationWrapper>
        </div>
      </section>
      
      {/* Additional Product Demo Section */}
        <section className="landing-section py-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">More Features to Explore</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover additional capabilities of our AI-powered CRM platform
              </p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <ProductDemo />
            </div>
          </ScrollAnimationWrapper>
        </div>
      </section>
      
      {/* Feature Showcase */}
      <FeatureShowcase />
      
      {/* Features Section */}
      <section className="py-20 content-stable" id="features">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                All the Features You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Smart CRM combines powerful sales tools with advanced AI capabilities to streamline your workflow and boost your results.
              </p>
            </div>
          </ScrollAnimationWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ScrollAnimationWrapper animation="fade-up" delay={100}>
              <FeatureCard
                icon={<Brain className="h-8 w-8 text-blue-600" />}
                title="AI Sales Tools"
                description="Access 20+ AI tools to automate tasks, get insights, and personalize your sales approach."
                link="/landing/features/ai-tools"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={200}>
              <FeatureCard
                icon={<Users className="h-8 w-8 text-indigo-600" />}
                title="Contact Management"
                description="Organize and track all your contacts, leads, and accounts in one unified database."
                link="/landing/features/contacts"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={300}>
              <FeatureCard
                icon={<Briefcase className="h-8 w-8 text-violet-600" />}
                title="Deal Pipeline"
                description="Visualize and optimize your sales pipeline with drag-and-drop simplicity and AI insights."
                link="/landing/features/pipeline"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={150}>
              <FeatureCard
                icon={<Brain className="h-8 w-8 text-fuchsia-600" />}
                title="AI Assistant"
                description="Work with a context-aware AI assistant that remembers conversations and takes actions for you."
                link="/landing/features/ai-assistant"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={250}>
              <FeatureCard
                icon={<Eye className="h-8 w-8 text-cyan-600" />}
                title="Vision Analyzer"
                description="Extract insights from images, documents, competitor materials, and visual content."
                link="/landing/features/vision-analyzer"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={350}>
              <FeatureCard
                icon={<Image className="h-8 w-8 text-emerald-600" />}
                title="Image Generator"
                description="Create professional images for presentations, proposals, and marketing materials instantly."
                link="/landing/features/image-generator"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={150}>
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8 text-indigo-600" />}
                title="Communications"
                description="Unified communication hub for email, calls, messages, and meetings all in one place."
                link="/landing/features/communications"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={250}>
              <FeatureCard
                icon={<Search className="h-8 w-8 text-blue-600" />}
                title="Semantic Search"
                description="Find anything in your CRM with natural language queries and contextual understanding."
                link="/landing/features/semantic-search"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={350}>
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-yellow-600" />}
                title="Function Assistant"
                description="Let AI perform real actions in your CRM through natural conversation."
                link="/landing/features/function-assistant"
              />
            </ScrollAnimationWrapper>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/features/ai-tools" className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
              Explore AI Tools <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* AI Highlights Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 content-stable gpu-accelerated">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                AI-Powered Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our cutting-edge AI tools designed specifically for sales professionals
              </p>
            </div>
          </ScrollAnimationWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScrollAnimationWrapper animation="slide-in" delay={100}>
              <Link to="/features/ai-assistant" className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-indigo-300 transform hover:-translate-y-1 animation-fix">
                <div className="p-3 bg-indigo-100 rounded-full w-min mb-4">
                  <Brain className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Sales Assistant</h3>
                <p className="text-gray-600 mb-4 flex-1">Get a context-aware AI assistant that can search your CRM, schedule tasks, and take actions for you.</p>
                <span className="text-indigo-600 flex items-center mt-auto">Learn more <ChevronRight className="h-4 w-4 ml-1" /></span>
              </Link>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="slide-in" delay={200}>
              <Link to="/features/vision-analyzer" className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-cyan-300 transform hover:-translate-y-1 animation-fix">
                <div className="p-3 bg-cyan-100 rounded-full w-min mb-4">
                  <Eye className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Vision Analyzer</h3>
                <p className="text-gray-600 mb-4 flex-1">Analyze documents, competitor materials, and visual content to extract valuable sales intelligence.</p>
                <span className="text-cyan-600 flex items-center mt-auto">Learn more <ChevronRight className="h-4 w-4 ml-1" /></span>
              </Link>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="slide-in" delay={300}>
              <Link to="/features/image-generator" className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-emerald-300 transform hover:-translate-y-1 animation-fix">
                <div className="p-3 bg-emerald-100 rounded-full w-min mb-4">
                  <Image className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Image Generator</h3>
                <p className="text-gray-600 mb-4 flex-1">Create professional product images, diagrams, and marketing visuals for your sales presentations.</p>
                <span className="text-emerald-600 flex items-center mt-auto">Learn more <ChevronRight className="h-4 w-4 ml-1" /></span>
              </Link>
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="slide-in" delay={400}>
              <Link to="/features/function-assistant" className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-amber-300 transform hover:-translate-y-1 animation-fix">
                <div className="p-3 bg-amber-100 rounded-full w-min mb-4">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Function Assistant</h3>
                <p className="text-gray-600 mb-4 flex-1">AI that performs real actions in your CRM through natural conversation and function calling.</p>
                <span className="text-amber-600 flex items-center mt-auto">Learn more <ChevronRight className="h-4 w-4 ml-1" /></span>
              </Link>
            </ScrollAnimationWrapper>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Hear from sales teams who've transformed their results with Smart CRM
              </p>
            </div>
          </ScrollAnimationWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScrollAnimationWrapper animation="fade-up" delay={100}>
              <TestimonialCard
                quote="Smart CRM has completely transformed our sales process. The AI insights help us prioritize the right leads and close 40% more deals."
                name="Sarah Johnson"
                position="VP of Sales"
                company="TechCorp"
                image="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                stars={5}
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={200}>
              <TestimonialCard
                quote="The AI assistant saves me 10 hours a week on administrative tasks. I can focus on what I do best - selling."
                name="Michael Chen"
                position="Senior Sales Rep"
                company="GlobalTech"
                image="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                stars={5}
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={300}>
              <TestimonialCard
                quote="The vision analyzer helps us understand competitor materials instantly. It's like having a research assistant that never sleeps."
                name="Emily Rodriguez"
                position="Sales Manager"
                company="InnovateNow"
                image="https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                stars={5}
              />
            </ScrollAnimationWrapper>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <ScrollAnimationWrapper animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the plan that fits your team size and needs. All plans include our core CRM features.
              </p>
            </div>
          </ScrollAnimationWrapper>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <ScrollAnimationWrapper animation="fade-up" delay={100}>
              <PricingCard
                tier="Starter"
                price={29}
                description="Perfect for small teams getting started"
                buttonText="Start Free Trial"
                features={[
                  "Up to 3 users",
                  "1,000 contacts",
                  "Basic CRM features",
                  "Email support",
                  "5 AI tool credits/month"
                ]}
                color="bg-white"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={200}>
              <PricingCard
                tier="Professional"
                price={79}
                description="Best for growing sales teams"
                buttonText="Start Free Trial"
                features={[
                  "Up to 10 users",
                  "10,000 contacts",
                  "Advanced pipeline management",
                  "Priority support",
                  "50 AI tool credits/month",
                  "Custom integrations",
                  "Advanced analytics"
                ]}
                popular={true}
                color="bg-gradient-to-br from-blue-50 to-indigo-50"
              />
            </ScrollAnimationWrapper>
            
            <ScrollAnimationWrapper animation="fade-up" delay={300}>
              <PricingCard
                tier="Enterprise"
                price={199}
                description="For large teams with advanced needs"
                buttonText="Contact Sales"
                features={[
                  "Unlimited users",
                  "Unlimited contacts",
                  "Custom workflows",
                  "Dedicated support",
                  "Unlimited AI tools",
                  "White-label options",
                  "Advanced security",
                  "Custom integrations"
                ]}
                color="bg-white"
              />
            </ScrollAnimationWrapper>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section
        className="py-20"
        style={{
          backgroundImage: `linear-gradient(to right, var(--wl-primary-color, #3B82F6), var(--wl-secondary-color, #6366F1))`
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimationWrapper animation="fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Sales Process?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Join thousands of sales teams using Smart CRM to close more deals and grow their business faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                to="/signup"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button 
                onClick={() => navigate('/demo')}
                className="text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Schedule Demo
              </button>
            </div>
            <p className="text-sm mt-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </ScrollAnimationWrapper>
        </div>
      </section>
      
      </main>
      
      <LandingFooter />
    </div>
    </>
  );
};

export default LandingPage;

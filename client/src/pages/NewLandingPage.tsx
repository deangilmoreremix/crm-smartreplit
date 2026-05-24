// New Landing Page - Isolated from existing LandingPage
// This page uses components from components.landing.new/ to avoid affecting the current application
// Preview at: /new-landing

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Clock,
  BarChart,
  Users,
  Briefcase,
  Eye,
  Image,
  Search,
  Zap,
} from 'lucide-react';

// Base components from isolated structure
import LandingHeader from '../components/landing.new/base/LandingHeader';
import LandingFooter from '../components/landing.new/base/LandingFooter';
import PricingCard from '../components/landing.new/base/PricingCard';
import FeatureCard from '../components/landing.new/base/FeatureCard';
import TestimonialCard from '../components/landing.new/base/TestimonialCard';
import AnimatedFeatureIcon from '../components/landing.new/base/AnimatedFeatureIcon';
import ClientLogos from '../components/landing.new/base/ClientLogos';
import StatCounter from '../components/landing.new/base/StatCounter';
import ScrollAnimationWrapper from '../components/landing.new/base/ScrollAnimationWrapper';
import ParticleBackground from '../components/landing.new/base/ParticleBackground';

// New showcases from isolated structure
import VideoCallShowcase from '../components/landing.new/showcases/VideoCallShowcase';
import AIToolsShowcase from '../components/landing.new/showcases/AIToolsShowcase';
import CommunicationHubShowcase from '../components/landing.new/showcases/CommunicationHubShowcase';
import SalesIntelligenceShowcase from '../components/landing.new/showcases/SalesIntelligenceShowcase';
import WhiteLabelShowcase from '../components/landing.new/showcases/WhiteLabelShowcase';
import ConnectedAppsShowcase from '../components/landing.new/showcases/ConnectedAppsShowcase';
import AIGoalsShowcase from '../components/landing.new/showcases/AIGoalsShowcase';
import DashboardAnalyticsShowcase from '../components/landing.new/showcases/DashboardAnalyticsShowcase';
import CalendarShowcase from '../components/landing.new/showcases/CalendarShowcase';
import SalesToolsShowcase from '../components/landing.new/showcases/SalesToolsShowcase';
import ContactsPipelineShowcase from '../components/landing.new/showcases/ContactsPipelineShowcase';
import TechnicalArchShowcase from '../components/landing.new/showcases/TechnicalArchShowcase';

const NewLandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const preloadHighPriorityAssets = () => {
      const criticalImages = [
        'https://images.pexels.com/photos/6476582/pexels-photo-6476582.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      ];

      if (typeof window !== 'undefined') {
        criticalImages.forEach((url) => {
          const img = new window.Image();
          img.src = url;
        });
      }
    };

    preloadHighPriorityAssets();
  }, []);

  return (
    <>
      <div className="bg-white content-stable">
        <LandingHeader />

        <main className="landing-content">
          {/* Hero Section */}
          <section className="landing-section">
            <div className="container mx-auto px-4 py-20 text-center">
              <ScrollAnimationWrapper animation="fade-up">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mb-6">
                  NEW & IMPROVED
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  The AI-Powered CRM Built for
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {' '}
                    Modern Sales
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  Unlock advanced AI contact intelligence with automated enrichment, smart scoring,
                  custom fields, comprehensive activity tracking, video calling, and powerful bulk
                  operations to supercharge your sales pipeline.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Link
                    to="/signup"
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => navigate('/demo')}
                    className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-all duration-200"
                  >
                    Watch Demo
                  </button>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </section>

          {/* Client logos */}
          <section className="landing-section">
            <ClientLogos />
          </section>

          {/* Stats Counter Section */}
          <section className="landing-section py-16 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
            <ParticleBackground particleCount={30} />
            <div className="container mx-auto px-4">
              <ScrollAnimationWrapper animation="fade-in">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">The Impact of SmartCRM</h2>
                  <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                    Real results from businesses using our SmartCRM platform
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

          {/* Video Calling Showcase - NEW */}
          <VideoCallShowcase />

          {/* Communication Hub Showcase - NEW */}
          <CommunicationHubShowcase />

          {/* Sales Intelligence Showcase - NEW */}
          <SalesIntelligenceShowcase />

          {/* AI Tools Showcase - NEW */}
          <AIToolsShowcase />

          {/* White Label Showcase - NEW */}
          <WhiteLabelShowcase />

          {/* Connected Apps Showcase - NEW */}
          <ConnectedAppsShowcase />

          {/* AI Goals Showcase - NEW */}
          <AIGoalsShowcase />

          {/* Dashboard & Analytics Showcase - NEW */}
          <DashboardAnalyticsShowcase />

          {/* Calendar & Appointments Showcase - NEW */}
          <CalendarShowcase />

          {/* Contacts & Pipeline Showcase - NEW */}
          <ContactsPipelineShowcase />

          {/* Sales Intelligence Tools Showcase - NEW */}
          <SalesToolsShowcase />

          {/* Technical Architecture Showcase - NEW */}
          <TechnicalArchShowcase />

          {/* Features Section */}
          <section className="py-20 content-stable" id="features">
            <div className="container mx-auto px-4">
              <ScrollAnimationWrapper animation="fade-up">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    All the Features You Need to Succeed
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    SmartCRM combines powerful sales tools with advanced AI capabilities to
                    streamline your workflow and boost your results.
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
                <Link
                  to="/features/ai-tools"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Explore AI Tools <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <ScrollAnimationWrapper animation="fade-up">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    What Our Customers Say
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Hear from sales teams who've transformed their results with SmartCRM
                  </p>
                </div>
              </ScrollAnimationWrapper>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <ScrollAnimationWrapper animation="fade-up" delay={100}>
                  <TestimonialCard
                    quote="SmartCRM has completely transformed our sales process. The AI insights help us prioritize the right leads and close 40% more deals."
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
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Simple, Transparent Pricing
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that fits your team size and needs. All plans include our core
                    CRM features.
                  </p>
                </div>
              </ScrollAnimationWrapper>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <ScrollAnimationWrapper animation="fade-up" delay={100}>
                  <PricingCard
                    tier="Starter"
                    price={29}
                    description="Perfect for small teams getting started"
                    buttonText="Get Started Now"
                    features={[
                      'Up to 3 users',
                      '1,000 contacts',
                      'Basic CRM features',
                      'Email support',
                      '5 AI tool credits/month',
                    ]}
                    color="bg-white"
                  />
                </ScrollAnimationWrapper>

                <ScrollAnimationWrapper animation="fade-up" delay={200}>
                  <PricingCard
                    tier="Professional"
                    price={79}
                    description="Best for growing sales teams"
                    buttonText="Get Started Now"
                    features={[
                      'Up to 10 users',
                      '10,000 contacts',
                      'Advanced pipeline management',
                      'Priority support',
                      '50 AI tool credits/month',
                      'Custom integrations',
                      'Advanced analytics',
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
                      'Unlimited users',
                      'Unlimited contacts',
                      'Custom workflows',
                      'Dedicated support',
                      'Unlimited AI tools',
                      'White-label options',
                      'Advanced security',
                      'Custom integrations',
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
              backgroundImage: `linear-gradient(to right, var(--wl-primary-color, #3B82F6), var(--wl-secondary-color, #6366F1))`,
            }}
          >
            <div className="container mx-auto px-4 text-center">
              <ScrollAnimationWrapper animation="fade-up">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Sales Process?
                </h2>
                <p
                  className="text-xl mb-8 max-w-2xl mx-auto"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  Join thousands of sales teams using SmartCRM to close more deals and grow their
                  business faster.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Link
                    to="/signup"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center"
                  >
                    Get Started Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => navigate('/demo')}
                    className="text-white border-2 border-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
                  >
                    Schedule Demo
                  </button>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </>
  );
};

export default NewLandingPage;
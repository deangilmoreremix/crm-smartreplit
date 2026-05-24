import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Brain, BarChart3, FileText, Activity, Database, Eye, Video, Settings } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

const NewFeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 content-stable">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full mb-4">
              NEW FEATURES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary AI Contact Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our latest enhancements that bring advanced AI capabilities to contact
              management, scoring, data enrichment, and seamless video collaboration.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-green-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4 group-hover:bg-green-200 transition-colors">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Contact Enrichment</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Automatically enrich contact data with AI-powered insights, company information, and
                social profiles to build complete contact profiles.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-green-600 text-sm font-medium">Automatic • Real-time</span>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-blue-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4 group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Lead Scoring</h3>
              <p className="text-gray-600 mb-4 flex-1">
                AI-based lead scoring with detailed rationale, engagement metrics, and behavioral
                analysis to prioritize your best prospects.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-blue-600 text-sm font-medium">ML-Powered • Accurate</span>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={300}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-purple-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4 group-hover:bg-purple-200 transition-colors">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dynamic Custom Fields</h3>
              <p className="text-gray-600 mb-4 flex-1">
                EAV-based dynamic custom fields system allowing flexible data structures and
                personalized contact information management.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-purple-600 text-sm font-medium">Fully Customizable • EAV</span>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={400}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-orange-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-orange-100 rounded-full w-min mb-4 group-hover:bg-orange-200 transition-colors">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Activity Timeline</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Comprehensive contact activity logging and timeline with detailed interaction
                history and automated activity recording.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-orange-600 text-sm font-medium">Auto-tracked • Complete</span>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={500}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-red-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-red-100 rounded-full w-min mb-4 group-hover:bg-red-200 transition-colors">
                <Video className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">HD Video Calling</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Crystal-clear video calls with screen sharing, recording, AI transcription, and
                integrated meeting notes right in your CRM.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-red-600 text-sm font-medium">HD Video • AI Transcription</span>
              </div>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={600}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-teal-300 transform hover:-translate-y-2 group">
              <div className="p-3 bg-teal-100 rounded-full w-min mb-4 group-hover:bg-teal-200 transition-colors">
                <Settings className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Settings Wizard</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Step-by-step configuration for OpenAI and Gemini API keys with model selection,
                testing, and secure encrypted storage.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-teal-600 text-sm font-medium">Secure • Step-by-step</span>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>

        <ScrollAnimationWrapper animation="fade-up" delay={700}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            <div className="text-center p-4 bg-white/50 rounded-xl">
              <div className="text-3xl font-bold text-green-600">50%</div>
              <div className="text-gray-600 text-sm">Faster Enrichment</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">35%</div>
              <div className="text-gray-600 text-sm">Sales Velocity</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600">24%</div>
              <div className="text-gray-600 text-sm">Lead Conversion</div>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">4K</div>
              <div className="text-gray-600 text-sm">Video Quality</div>
            </div>
          </div>
        </ScrollAnimationWrapper>

        <div className="text-center mt-12">
          <Link
            to="/features/contacts"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Explore All Contact Features <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewFeaturesSection;

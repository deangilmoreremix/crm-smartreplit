import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Brain, BarChart3, FileText, Activity, Database, Eye } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';

const NewFeaturesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 content-stable">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              New AI-Powered Contact Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our latest enhancements that bring advanced AI capabilities to contact
              management, scoring, and data enrichment.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-green-300 transform hover:-translate-y-1">
              <div className="p-3 bg-green-100 rounded-full w-min mb-4">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Contact Enrichment</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Automatically enrich contact data with AI-powered insights, company information, and
                social profiles to build complete contact profiles.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-blue-300 transform hover:-translate-y-1">
              <div className="p-3 bg-blue-100 rounded-full w-min mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Lead Scoring</h3>
              <p className="text-gray-600 mb-4 flex-1">
                AI-based lead scoring with detailed rationale, engagement metrics, and behavioral
                analysis to prioritize your best prospects.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={300}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-purple-300 transform hover:-translate-y-1">
              <div className="p-3 bg-purple-100 rounded-full w-min mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Dynamic Custom Fields</h3>
              <p className="text-gray-600 mb-4 flex-1">
                EAV-based dynamic custom fields system allowing flexible data structures and
                personalized contact information management.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={400}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-orange-300 transform hover:-translate-y-1">
              <div className="p-3 bg-orange-100 rounded-full w-min mb-4">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Activity Timeline</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Comprehensive contact activity logging and timeline with detailed interaction
                history and automated activity recording.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={500}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-red-300 transform hover:-translate-y-1">
              <div className="p-3 bg-red-100 rounded-full w-min mb-4">
                <Database className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Bulk Operations</h3>
              <p className="text-gray-600 mb-4 flex-1">
                Powerful bulk operations for contact analysis, enrichment, and processing, enabling
                efficient management of large contact databases.
              </p>
            </div>
          </ScrollAnimationWrapper>

          <ScrollAnimationWrapper animation="slide-in" delay={600}>
            <Link to="/features/enhanced-ui">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col hover:border-teal-300 transform hover:-translate-y-1 cursor-pointer">
                <div className="p-3 bg-teal-100 rounded-full w-min mb-4">
                  <Eye className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Enhanced UI Components</h3>
                <p className="text-gray-600 mb-4 flex-1">
                  Enhanced UI components with improved design patterns, responsive layouts, and
                  modern interaction elements for better user experience.
                </p>
              </div>
            </Link>
          </ScrollAnimationWrapper>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/features/contacts"
            className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Explore Contact Features <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewFeaturesSection;

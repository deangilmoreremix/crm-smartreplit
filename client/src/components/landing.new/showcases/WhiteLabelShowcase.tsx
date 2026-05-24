import React, { useState } from 'react';
import {
  Palette, Globe, Users, DollarSign, TrendingUp, Star, Check, Settings,
  Brush, Type, Image, Layout, Eye, RefreshCw, ChevronRight, ArrowRight,
  Crown, Shield, Zap
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

const WhiteLabelShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [previewColor, setPreviewColor] = useState<string>('#3B82F6');

  const whiteLabelFeatures = [
    { icon: <Palette size={20} />, title: 'Brand Customization', desc: 'Full logo, colors, fonts control' },
    { icon: <Globe size={20} />, title: 'Custom Domain', desc: 'White-label yourdomain.com' },
    { icon: <Type size={20} />, title: 'Typography', desc: 'Custom fonts and typography' },
    { icon: <Image size={20} />, title: 'Logo Management', desc: 'Upload, resize, position logos' },
    { icon: <Layout size={20} />, title: 'Layout Options', desc: 'Customizable UI layouts' },
    { icon: <Eye size={20} />, title: 'Live Preview', desc: 'See changes in real-time' },
  ];

  const partnerTiers = [
    { name: 'Bronze', color: 'from-amber-700 to-amber-900', benefits: ['5 clients', 'Basic branding', 'Email support'], popular: false },
    { name: 'Silver', color: 'from-gray-400 to-gray-600', benefits: ['25 clients', 'Full branding', 'Priority support'], popular: true },
    { name: 'Gold', color: 'from-yellow-500 to-amber-600', benefits: ['Unlimited clients', 'Advanced branding', '24/7 support', 'Revenue dashboard'], popular: false },
    { name: 'Platinum', color: 'from-purple-500 to-purple-900', benefits: ['Unlimited everything', 'White-label mobile app', 'API access', 'Dedicated manager'], popular: false },
  ];

  return (
    <section className={`py-20 ${isDark ? 'bg-slate-800' : 'bg-gradient-to-br from-gray-50 to-purple-50'}`}>
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full mb-4">
              WHITE LABEL & PARTNERS
            </span>
            <h2 className={`text-3xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              Build Your CRM Empire
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              White-label the entire platform with your branding, set your prices, 
              and earn revenue share on every customer you bring.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Branding preview */}
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Brand Preview</h3>
                <button className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-blue-500`}>
                  <RefreshCw size={14} className="mr-1" /> Reset
                </button>
              </div>

              {/* Mini CRM preview */}
              <div className="rounded-xl overflow-hidden border border-gray-200 mb-6">
                <div className="h-2" style={{ backgroundColor: previewColor }}></div>
                <div className="bg-gray-100 p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-8 h-8 rounded bg-gray-300" style={{ backgroundColor: previewColor }}></div>
                    <span className="font-bold text-gray-700">Your CRM Name</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="h-12 bg-white rounded shadow-sm"></div>
                    <div className="h-12 bg-white rounded shadow-sm"></div>
                    <div className="h-12 bg-white rounded shadow-sm"></div>
                  </div>
                  <div className="h-24 bg-white rounded shadow-sm"></div>
                </div>
              </div>

              {/* Color picker */}
              <div className="mb-4">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 block`}>Primary Color</label>
                <div className="flex space-x-2">
                  {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setPreviewColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${previewColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {whiteLabelFeatures.map((feature, index) => (
                  <div key={index} className={`${isDark ? 'bg-slate-800' : 'bg-gray-50'} rounded-lg p-3 text-center`}>
                    <div className="text-blue-600 mb-1 flex justify-center">{feature.icon}</div>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Partner tiers */}
          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="space-y-4">
              {partnerTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} rounded-xl p-5 border ${tier.popular ? 'ring-2 ring-blue-500' : ''} relative`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-full flex items-center">
                      <Star size={12} className="mr-1" /> Most Popular
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-white font-bold`}>
                        {tier.name[0]}
                      </div>
                      <div>
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{tier.name} Partner</h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{tier.benefits.length} included benefits</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tier.benefits.map((benefit, i) => (
                      <span key={i} className={`inline-flex items-center text-xs ${isDark ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded`}>
                        <Check size={12} className="mr-1 text-green-500" /> {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* Revenue stats */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
            {[
              { value: '500+', label: 'Partners', icon: <Users size={20} /> },
              { value: '$2.5M', label: 'Revenue Shared', icon: <DollarSign size={20} /> },
              { value: '15%', label: 'Commission', icon: <TrendingUp size={20} /> },
              { value: '98%', label: 'Partner Retention', icon: <Crown size={20} /> },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className="text-blue-600 mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="text-center mt-12">
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
              Become a Partner <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default WhiteLabelShowcase;
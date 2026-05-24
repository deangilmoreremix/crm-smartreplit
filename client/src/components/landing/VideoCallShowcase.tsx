import React, { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Play, Users, CheckCircle, Monitor, Circle, MessageSquare, Clock, FileText, Send } from 'lucide-react';
import ScrollAnimationWrapper from './ScrollAnimationWrapper';
import AnimatedFeatureIcon from './AnimatedFeatureIcon';
import { useTheme } from '../../contexts/ThemeContext';

const VideoCallShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'video' | 'screen' | 'record' | 'transcribe'>('video');
  const [isCallActive, setIsCallActive] = useState(false);

  const tabs = [
    { id: 'video', label: 'HD Video', icon: <Video size={18} />, color: 'bg-blue-500' },
    { id: 'screen', label: 'Screen Share', icon: <Monitor size={18} />, color: 'bg-emerald-500' },
    { id: 'record', label: 'Recording', icon: <Circle size={18} />, color: 'bg-red-500' },
    { id: 'transcribe', label: 'AI Transcription', icon: <MessageSquare size={18} />, color: 'bg-purple-500' },
  ];

  const demoFeatures = [
    { icon: <CheckCircle size={16} />, text: 'Crystal-clear HD video calls' },
    { icon: <CheckCircle size={16} />, text: 'Instant screen sharing' },
    { icon: <CheckCircle size={16} />, text: 'One-click recording' },
    { icon: <CheckCircle size={16} />, text: 'AI-powered transcription' },
    { icon: <CheckCircle size={16} />, text: 'Meeting notes auto-generation' },
    { icon: <CheckCircle size={16} />, text: 'Integrated calendar scheduling' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 text-sm font-semibold rounded-full mb-4">
              VIDEO CALLING
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Crystal-Clear Video Meetings
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience seamless video calls with AI-powered transcription, screen sharing, 
              recording, and automatic meeting notes — all built into your CRM.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Video Call Demo */}
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
              {/* Mock video call UI */}
              <div className="relative h-[400px] bg-gray-900">
                {/* Remote video (demo) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users size={40} className="text-white" />
                    </div>
                    <p className="text-white font-medium">Sarah Johnson</p>
                    <p className="text-gray-400 text-sm">Sales Manager</p>
                  </div>
                </div>

                {/* Tab bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-xl p-1 flex space-x-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                          activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating animated icons */}
                <div className="absolute top-20 right-4">
                  <AnimatedFeatureIcon icon={<Circle size={20} />} color="bg-red-500" delay={0} size="sm" />
                </div>
                <div className="absolute bottom-32 left-4">
                  <AnimatedFeatureIcon icon={<MessageSquare size={20} />} color="bg-purple-500" delay={1} size="sm" />
                </div>

                {/* Call controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                      <Mic className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                      <Video className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                      <PhoneOff className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                      <Monitor className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                      <Circle className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-gray-300 text-sm">Demo Call • 00:00:42</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Features list */}
          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {demoFeatures.slice(0, 4).map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      {feature.icon}
                    </div>
                    <span className="text-gray-200">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <MessageSquare size={20} className="text-purple-400" />
                  </div>
                  <span className="text-white font-semibold">AI Transcription Active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Clock size={14} className="text-gray-400 mt-1" />
                    <div className="text-sm">
                      <p className="text-gray-300">"Let's discuss the Q4 pipeline priorities..."</p>
                      <p className="text-gray-500 text-xs">02:14 - Sarah Johnson</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Clock size={14} className="text-gray-400 mt-1" />
                    <div className="text-sm">
                      <p className="text-gray-300">"I think we should focus on enterprise deals..."</p>
                      <p className="text-gray-500 text-xs">02:28 - You</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">Join from anywhere</p>
                  <p className="text-gray-400">Desktop, mobile, or browser-based</p>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* Stats */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            {[
              { value: '4K', label: 'Video Quality' },
              { value: '<50ms', label: 'Latency' },
              { value: '99.9%', label: 'Uptime' },
              { value: '10K+', label: 'Calls Monthly' },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default VideoCallShowcase;
import React, { useState } from 'react';
import {
  Calendar, Clock, Video, Phone, MapPin, Users, CheckCircle, Bell,
  Play, ChevronRight, Repeat, AlertCircle, Link2, FileText, Sparkles
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface Appointment {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  contact: string;
  location?: string;
}

const CalendarShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(3);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [28, 29, 30, 31, 1, 2, 3];

  const appointments: Appointment[] = [
    { id: '1', title: 'Q4 Pipeline Review', time: '9:00 AM', duration: '45 min', type: 'video', status: 'scheduled', contact: 'Sarah Johnson' },
    { id: '2', title: 'Product Demo Call', time: '11:30 AM', duration: '30 min', type: 'phone', status: 'scheduled', contact: 'Michael Chen' },
    { id: '3', title: 'Contract Negotiation', time: '2:00 PM', duration: '60 min', type: 'in-person', status: 'scheduled', contact: 'Emily Rodriguez', location: 'Conference Room A' },
    { id: '4', title: 'Follow-up Meeting', time: '4:30 PM', duration: '25 min', type: 'video', status: 'completed', contact: 'David Kim' },
  ];

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      case 'canceled': return 'bg-red-500';
      case 'no-show': return 'bg-amber-500';
    }
  };

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-purple-500" />;
      case 'phone': return <Phone size={14} className="text-green-500" />;
      case 'in-person': return <MapPin size={14} className="text-blue-500" />;
    }
  };

  const features = [
    { icon: <Calendar size={20} />, title: 'Interactive Calendar', desc: 'Drag-and-drop scheduling', color: 'bg-blue-500' },
    { icon: <Video size={20} />, title: 'Video/Phone/In-Person', desc: 'Multi-channel support', color: 'bg-purple-500' },
    { icon: <Users size={20} />, title: 'Contact Integration', desc: 'Auto-populate data', color: 'bg-indigo-500' },
    { icon: <Link2 size={20} />, title: 'Meeting Links', desc: 'Auto-generate & share', color: 'bg-cyan-500' },
    { icon: <Clock size={20} />, title: 'Time Slots', desc: 'Visual availability', color: 'bg-emerald-500' },
    { icon: <AlertCircle size={20} />, title: 'Conflict Detection', desc: 'Smart scheduling', color: 'bg-amber-500' },
    { icon: <Repeat size={20} />, title: 'Recurring', desc: 'Automated scheduling', color: 'bg-pink-500' },
    { icon: <Bell size={20} />, title: 'Reminders', desc: 'Customizable timing', color: 'bg-rose-500' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full mb-4">
              CALENDAR & APPOINTMENTS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Smart Scheduling That Works for You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your appointments with intelligent scheduling, automatic reminders, 
              and seamless video integration — all in one powerful calendar system.
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Calendar Mockup */}
          <ScrollAnimationWrapper animation="slide-in" delay={100}>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">May 2026</h3>
                    <p className="text-blue-200 text-sm">Team Calendar</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <ChevronRight size={18} className="transform rotate-180" />
                    </button>
                    <button className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors">
                      Today
                    </button>
                    <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Week Days Header */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {weekDays.map((day, index) => (
                  <div key={index} className="py-3 text-center">
                    <span className={`text-xs font-semibold ${index === 3 ? 'text-blue-600' : 'text-gray-500'}`}>
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-7">
                {dates.map((date, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`relative p-2 min-h-[80px] border-r border-b border-gray-100 cursor-pointer transition-all ${
                      selectedDate === date ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } ${index === 6 ? 'border-r-0' : ''}`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                      selectedDate === date
                        ? 'bg-blue-600 text-white'
                        : date === 31 || date === 1
                          ? 'text-gray-400'
                          : 'text-gray-700'
                    }`}>
                      {date}
                    </div>
                    {selectedDate === date && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] text-gray-600 truncate">9:00 AM</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                          <span className="text-[10px] text-gray-600 truncate">11:30 AM</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <span className="text-[10px] text-gray-600 truncate">2:00 PM</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Floating animated icons */}
              <div className="absolute top-40 right-8 hidden lg:block">
                <AnimatedFeatureIcon icon={<Sparkles size={20} />} color="bg-yellow-500" delay={0} size="sm" />
              </div>
              <div className="absolute bottom-32 left-8 hidden lg:block">
                <AnimatedFeatureIcon icon={<Calendar size={20} />} color="bg-blue-500" delay={1} size="sm" />
              </div>
            </div>
          </ScrollAnimationWrapper>

          {/* Appointments List */}
          <ScrollAnimationWrapper animation="slide-in" delay={200}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Today's Appointments</h3>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center">
                  View all <ChevronRight size={14} className="ml-1" />
                </button>
              </div>

              <div className="space-y-4">
                {appointments.map((apt, index) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(apt.status)}/10`}>
                          {getTypeIcon(apt.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{apt.title}</h4>
                          <p className="text-sm text-gray-500">{apt.contact}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="flex items-center text-xs text-gray-500">
                              <Clock size={12} className="mr-1" />
                              {apt.time} · {apt.duration}
                            </span>
                            {apt.location && (
                              <span className="flex items-center text-xs text-gray-500">
                                <MapPin size={12} className="mr-1" />
                                {apt.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                        {apt.status === 'scheduled' && (
                          <button className="p-1.5 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                            <Video size={14} className="text-blue-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meeting Preparation */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">Meeting Preparation</h4>
                    <p className="text-sm text-indigo-200">AI-powered insights</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm">Review: Sarah's Q4 goals from last meeting</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-sm">Prepare: Custom pricing proposal ready</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                    <Bell size={16} className="text-amber-400" />
                    <span className="text-sm">Reminder: Send agenda 1 hour before</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimationWrapper>
        </div>

        {/* Features Grid */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="text-white">{feature.icon}</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Stats */}
        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            {[
              { value: '10K+', label: 'Appointments Monthly' },
              { value: '95%', label: 'Show Rate' },
              { value: '50+', label: 'Integrations' },
              { value: '2min', label: 'Avg. Booking Time' },
            ].map((stat, index) => (
              <div key={index} className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-md">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>
      </div>
    </section>
  );
};

export default CalendarShowcase;
import React, { useState } from 'react';
import {
  Target, TrendingUp, CheckCircle, Clock, Users, Trophy, Calendar, Zap,
  ChevronRight, ArrowRight, Play, BarChart3, Flag, Medal, CalendarCheck, Sparkles
} from 'lucide-react';
import ScrollAnimationWrapper from '../base/ScrollAnimationWrapper';
import AnimatedFeatureIcon from '../base/AnimatedFeatureIcon';
import { useTheme } from '../../../contexts/ThemeContext';

interface GoalCard {
  id: string;
  title: string;
  category: string;
  progress: number;
  milestones: number;
  completedMilestones: number;
  dueDate: string;
  team: string[];
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

interface GoalStats {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const AIGoalsShowcase: React.FC = () => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Goals', count: 24, icon: <Target size={16} /> },
    { id: 'sales', label: 'Sales', count: 6, icon: <TrendingUp size={16} /> },
    { id: 'marketing', label: 'Marketing', count: 4, icon: <Sparkles size={16} /> },
    { id: 'relationship', label: 'Relationship', count: 5, icon: <Users size={16} /> },
    { id: 'automation', label: 'Automation', count: 4, icon: <Zap size={16} /> },
    { id: 'analytics', label: 'Analytics', count: 3, icon: <BarChart3 size={16} /> },
    { id: 'content', label: 'Content', count: 2, icon: <Flag size={16} /> },
  ];

  const goals: GoalCard[] = [
    {
      id: 'goal-1',
      title: 'Q2 Revenue Target',
      category: 'sales',
      progress: 78,
      milestones: 5,
      completedMilestones: 4,
      dueDate: 'Jun 30',
      team: ['JD', 'MK', 'SR'],
      priority: 'high',
      icon: <Trophy size={20} />,
    },
    {
      id: 'goal-2',
      title: 'Lead Generation Campaign',
      category: 'marketing',
      progress: 45,
      milestones: 4,
      completedMilestones: 2,
      dueDate: 'Jul 15',
      team: ['AL', 'BN'],
      priority: 'high',
      icon: <Target size={20} />,
    },
    {
      id: 'goal-3',
      title: 'Customer Retention Rate',
      category: 'relationship',
      progress: 92,
      milestones: 3,
      completedMilestones: 3,
      dueDate: 'Aug 1',
      team: ['JC', 'DK', 'MR', 'TW'],
      priority: 'medium',
      icon: <Users size={20} />,
    },
    {
      id: 'goal-4',
      title: 'Workflow Automation',
      category: 'automation',
      progress: 60,
      milestones: 6,
      completedMilestones: 4,
      dueDate: 'Jun 20',
      team: ['PK', 'LS'],
      priority: 'medium',
      icon: <Zap size={20} />,
    },
    {
      id: 'goal-5',
      title: 'Analytics Dashboard',
      category: 'analytics',
      progress: 85,
      milestones: 4,
      completedMilestones: 3,
      dueDate: 'Jun 25',
      team: ['RH', 'MW'],
      priority: 'low',
      icon: <BarChart3 size={20} />,
    },
    {
      id: 'goal-6',
      title: 'Content Calendar Launch',
      category: 'content',
      progress: 30,
      milestones: 5,
      completedMilestones: 1,
      dueDate: 'Aug 30',
      team: ['SB', 'KT', 'JP'],
      priority: 'medium',
      icon: <Calendar size={20} />,
    },
    {
      id: 'goal-7',
      title: 'Team Training Program',
      category: 'relationship',
      progress: 55,
      milestones: 4,
      completedMilestones: 2,
      dueDate: 'Jul 10',
      team: ['AR', 'LM'],
      priority: 'high',
      icon: <Medal size={20} />,
    },
    {
      id: 'goal-8',
      title: 'Sales Pipeline Optimization',
      category: 'sales',
      progress: 67,
      milestones: 5,
      completedMilestones: 3,
      dueDate: 'Jul 25',
      team: ['JD', 'CK', 'FN'],
      priority: 'high',
      icon: <TrendingUp size={20} />,
    },
  ];

  const stats: GoalStats[] = [
    { label: 'Goals Completed', value: '156', change: '+12%', positive: true },
    { label: 'In Progress', value: '24', change: '+3', positive: true },
    { label: 'Team Members', value: '48', change: '+5', positive: true },
    { label: 'Success Rate', value: '94%', change: '+8%', positive: true },
  ];

  const features = [
    { icon: <Target size={20} />, label: 'AI-Assisted Goal Setting', color: 'bg-violet-500' },
    { icon: <TrendingUp size={20} />, label: 'Progress Tracking', color: 'bg-emerald-500' },
    { icon: <Flag size={20} />, label: 'Milestone Management', color: 'bg-amber-500' },
    { icon: <BarChart3 size={20} />, label: 'Performance Analytics', color: 'bg-blue-500' },
    { icon: <Users size={20} />, label: 'Team Goals', color: 'bg-pink-500' },
    { icon: <Calendar size={20} />, label: 'Goal Templates', color: 'bg-cyan-500' },
    { icon: <Clock size={20} />, label: 'Progress Notifications', color: 'bg-rose-500' },
    { icon: <Zap size={20} />, label: 'Goal Automation', color: 'bg-orange-500' },
  ];

  const filteredGoals = activeCategory === 'all'
    ? goals
    : goals.filter(g => g.category === activeCategory);

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'from-emerald-500 to-teal-500';
    if (progress >= 50) return 'from-blue-500 to-indigo-500';
    if (progress >= 25) return 'from-amber-500 to-orange-500';
    return 'from-slate-500 to-gray-500';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <section className="relative min-h-screen py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-float-delayed-1" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-float-delayed-2" />
        <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-pink-500/15 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <ScrollAnimationWrapper animation="fade-up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-full mb-6 shadow-lg shadow-violet-500/30">
              <Target size={18} />
              <span>AI-POWERED GOALS</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Achieve More with
              <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Goals
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Set intelligent goals, track progress in real-time, and let AI help you hit every target with precision and confidence.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Stats Section */}
        <ScrollAnimationWrapper animation="fade-up" delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                <div className={`flex items-center text-sm ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stat.positive ? '↑' : '↓'} {stat.change}
                </div>
              </div>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Category Tabs */}
        <ScrollAnimationWrapper animation="fade-up" delay={200}>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeCategory === cat.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </ScrollAnimationWrapper>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto mb-16">
          {filteredGoals.map((goal, index) => (
            <ScrollAnimationWrapper key={goal.id} animation="slide-in" delay={index * 75}>
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${goal.progress >= 75 ? 'from-emerald-500/20 to-teal-500/20' : goal.progress >= 50 ? 'from-blue-500/20 to-indigo-500/20' : 'from-amber-500/20 to-orange-500/20'} group-hover:scale-110 transition-transform`}>
                    <span className={goal.progress >= 75 ? 'text-emerald-400' : goal.progress >= 50 ? 'text-blue-400' : 'text-amber-400'}>
                      {goal.icon}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityBadge(goal.priority)}`}>
                    {goal.priority}
                  </span>
                </div>

                {/* Title & Category */}
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-violet-300 transition-colors">
                  {goal.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 capitalize">{goal.category}</p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-semibold text-white">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(goal.progress)} rounded-full transition-all duration-1000`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Flag size={14} />
                    <span>{goal.completedMilestones}/{goal.milestones} milestones</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} />
                    <span className="text-sm">{goal.dueDate}</span>
                  </div>
                  <div className="flex -space-x-2">
                    {goal.team.slice(0, 3).map((member, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xs text-white font-semibold border-2 border-slate-900/50"
                        title={member}
                      >
                        {member}
                      </div>
                    ))}
                    {goal.team.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-semibold border-2 border-slate-900/50">
                        +{goal.team.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          ))}
        </div>

        {/* Features Grid */}
        <ScrollAnimationWrapper animation="fade-up" delay={300}>
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white text-center mb-10">
              Powerful AI Goal Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 group cursor-pointer"
                >
                  <div className={`p-2.5 rounded-lg ${feature.color} group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimationWrapper>

        {/* CTA Section */}
        <ScrollAnimationWrapper animation="fade-up" delay={400}>
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4">
              <button className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-1">
                <Play size={20} className="group-hover:scale-110 transition-transform" />
                <span>Start Setting Goals</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1">
                <CalendarCheck size={20} />
                <span>View Demo</span>
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Join 2,400+ teams achieving their goals with AI-powered goal management
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-delayed-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-2deg); }
        }
        @keyframes float-delayed-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes pulse-slow-delayed {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.08); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed-1 { animation: float-delayed-1 10s ease-in-out infinite; animation-delay: 0.5s; }
        .animate-float-delayed-2 { animation: float-delayed-2 9s ease-in-out infinite; animation-delay: 1s; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-pulse-slow-delayed { animation: pulse-slow-delayed 7s ease-in-out infinite; animation-delay: 0.5s; }
        .gpu-accelerated { transform: translateZ(0); }
      `}</style>
    </section>
  );
};

export default AIGoalsShowcase;
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useDealStore } from '../../store/dealStore';
import { useTaskStore } from '../../store/taskStore';
import { Users, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const timeAgo = (ms: number) => {
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const toMs = (d: Date | string | undefined) => {
  const ms = d ? new Date(d).getTime() : NaN;
  return Number.isNaN(ms) ? 0 : ms;
};

const RecentActivity: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();
  const { deals } = useDealStore();
  const { tasks } = useTaskStore();

  // Upcoming = open deals, soonest expected close date first (deals without a date last)
  const upcomingDeals = Object.values(deals)
    .filter((d) => String(d.stage) !== 'closed-won' && String(d.stage) !== 'closed-lost')
    .map((d) => ({ deal: d, due: toMs(d.expectedCloseDate ?? d.dueDate) }))
    .sort((a, b) => (a.due || Infinity) - (b.due || Infinity))
    .slice(0, 3);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  // Real activity: most recently updated deals, tasks and contacts
  const recentActivities = [
    ...Object.values(deals).map((d) => ({
      time: toMs(d.updatedAt),
      icon: TrendingUp,
      color: 'text-blue-600',
      title: toMs(d.updatedAt) === toMs(d.createdAt) ? 'Deal created' : 'Deal updated',
      description: `${d.title} - ${formatCurrency(d.value)} (${String(d.stage)})`,
    })),
    ...tasks.map((t) => ({
      time: toMs(t.status === 'completed' ? (t.completedDate ?? t.updatedAt) : t.updatedAt),
      icon: CheckCircle,
      color: t.status === 'completed' ? 'text-green-600' : 'text-purple-600',
      title: t.status === 'completed' ? 'Task completed' : 'Task updated',
      description: t.title,
    })),
    ...Object.values(contacts).map((c) => ({
      time: toMs(c.updatedAt),
      icon: Users,
      color: 'text-purple-600',
      title: toMs(c.updatedAt) === toMs(c.createdAt) ? 'Contact added' : 'Contact updated',
      description: c.name,
    })),
  ]
    .filter((a) => a.time > 0)
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Upcoming Deals Section */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Upcoming Deals
          </h3>
          <Link
            to="/deals"
            className={`flex items-center space-x-1 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingDeals.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No open deals yet.
            </p>
          )}
          {upcomingDeals.map(({ deal, due }) => {
            const contact = contacts[deal.contactId];

            return (
              <div
                key={deal.id}
                className={`flex items-center justify-between p-4 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-100/80'} rounded-xl transition-colors cursor-pointer`}
                onClick={() => (window.location.href = `/deals/${deal.id}`)}
              >
                <div className="flex items-center space-x-3">
                  {contact && (
                    <Avatar
                      src={contact.avatarSrc || contact.avatar}
                      alt={contact.name}
                      size="sm"
                      fallback={getInitials(contact.name)}
                    />
                  )}
                  <div>
                    <h4
                      className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}
                    >
                      {deal.title}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {contact ? contact.name : 'Unknown Contact'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>
                    {formatCurrency(deal.value)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {deal.probability}% •{' '}
                    {due ? new Date(due).toLocaleDateString() : 'No close date'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {completedTasks} completed
            </span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {pendingTasks} pending
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {recentActivities.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No recent activity yet.
            </p>
          )}
          {recentActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={index}
                className={`flex items-start space-x-3 p-3 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50/80'} rounded-lg transition-colors`}
              >
                <div
                  className={`p-2 rounded-lg ${activity.color} ${isDark ? 'bg-opacity-10' : 'bg-opacity-10'}`}
                >
                  <Icon className={`w-4 h-4 ${isDark ? activity.color : activity.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>
                    {activity.title}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activity.description}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    {timeAgo(activity.time)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;

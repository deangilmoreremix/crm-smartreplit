import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import TasksSection from '../TasksSection';
import AppointmentWidget from '../AppointmentWidget';
import InteractionHistory from '../dashboard/InteractionHistory';
import TasksAndFunnel from '../dashboard/TasksAndFunnel';
import RecentActivity from '../dashboard/RecentActivity';
import { useCommunicationStore } from '../../store/communicationStore';
import { useContactStore } from '../../store/contactStore';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import SampleBadge from '../SampleBadge';

const SAMPLE_COMMUNICATIONS = [
  { id: 's1', title: 'Email Follow-up', subtitle: 'Microsoft deal', when: 'Today', kind: 'email' },
  {
    id: 's2',
    title: 'Meeting Notes',
    subtitle: 'Ford collaboration',
    when: 'Yesterday',
    kind: 'meeting',
  },
];

const KIND_LABEL: Record<string, string> = {
  email: 'Email',
  call: 'Call',
  meeting: 'Meeting',
  text: 'Text',
  video_call: 'Video call',
  note: 'Note',
};

const ActivitiesCommunications: React.FC = () => {
  const { isDark } = useTheme();
  const { showDemoData } = useDemoDataSafe();
  const logs = useCommunicationStore((st) => st.communicationLogs);
  const contacts = useContactStore((st) => st.contacts);

  const realCommunications = [...(logs ?? [])]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      title: l.subject || KIND_LABEL[l.type] || 'Communication',
      subtitle: contacts?.[l.contactId]?.name ?? KIND_LABEL[l.type] ?? '',
      when: new Date(l.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      kind: l.type,
    }));
  const isSampleComms = realCommunications.length === 0 && showDemoData;
  const communications = realCommunications.length
    ? realCommunications
    : showDemoData
      ? SAMPLE_COMMUNICATIONS
      : [];

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
          <CheckSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activities & Communications
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your tasks, appointments, and communications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tasks Section - takes 2 columns */}
        <div className="lg:col-span-2">
          <div
            className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}
          >
            <h3
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}
            >
              <CheckSquare className="h-5 w-5 mr-2 text-orange-500" />
              Tasks & Activities
            </h3>
            <TasksSection />
          </div>

          {/* Interaction History */}
          <div className="mb-6">
            <InteractionHistory />
          </div>
        </div>

        {/* Right Side - Appointments and Activity */}
        <div className="space-y-6 lg:col-span-1">
          {/* Appointments Widget */}
          <div
            className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl overflow-hidden`}
          >
            <div
              className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}
            >
              <h3
                className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Upcoming Appointments
              </h3>
            </div>
            <AppointmentWidget limit={5} />
          </div>

          {/* Quick Tasks Widget */}
          <div
            className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl overflow-hidden`}
          >
            <div
              className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}
            >
              <h3
                className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                Communications
                {isSampleComms && <SampleBadge className="ml-2" />}
              </h3>
            </div>
            <div className="p-4">
              {communications.length === 0 && (
                <p
                  className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  data-testid="communications-empty"
                >
                  No communications yet.
                </p>
              )}
              <div className="space-y-3">
                {communications.map((c) => {
                  const Icon = c.kind === 'email' ? MessageSquare : Calendar;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}
                          >
                            <Icon size={14} />
                          </div>
                          <div>
                            <p
                              className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
                            >
                              {c.title}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {c.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {c.when}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks and Funnel Section */}
      <div className="mb-6">
        <TasksAndFunnel />
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <RecentActivity />
      </div>
    </div>
  );
};

export default ActivitiesCommunications;

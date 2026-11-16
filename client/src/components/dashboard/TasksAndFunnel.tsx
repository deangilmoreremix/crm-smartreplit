import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { MoreHorizontal, ArrowRight, Calendar, UserPlus, Users, Plus } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getInitials } from '../../utils/avatars';

// Component to display assignee avatars
const TaskAssignees: React.FC<{
  assigneeIds: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  onClick?: (id: string) => void;
}> = ({ assigneeIds, maxVisible = 3, size = 'sm', onClick }) => {
  const { isDark } = useTheme();
  const { contacts } = useContactStore();

  // Filter out duplicate IDs and any IDs that don't correspond to contacts
  const uniqueAssigneeIds = [...new Set(assigneeIds)];
  const validAssignees = uniqueAssigneeIds.filter((id) => contacts[id]);

  if (!validAssignees.length) {
    return (
      <div
        className={`w-5 h-5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} flex items-center justify-center text-xs`}
      >
        0
      </div>
    );
  }

  const visibleAssignees = validAssignees.slice(0, maxVisible);
  const remainingCount = validAssignees.length - maxVisible;

  return (
    <div className="flex -space-x-2">
      {visibleAssignees.map((assigneeId) => {
        const contact = contacts[assigneeId];
        // Map interestLevel to Avatar status
        let status: 'online' | 'away' | 'offline' = 'offline';
        if (contact.interestLevel === 'hot') status = 'online';
        else if (contact.interestLevel === 'warm' || contact.interestLevel === 'medium')
          status = 'away';

        return (
          <div
            key={assigneeId}
            className="relative cursor-pointer hover:z-10 transition-all hover:transform hover:scale-110"
            onClick={() => onClick && onClick(assigneeId)}
            title={contact.name}
          >
            <Avatar
              src={contact.avatarSrc || contact.avatar}
              alt={contact.name}
              size={size}
              status={status}
            />
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div
          className={`relative z-10 w-7 h-7 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} flex items-center justify-center text-xs font-medium shadow-sm`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Calendar day component with avatar support
const CalendarDay: React.FC<{
  day: number;
  isToday?: boolean;
  assigneeIds?: string[];
  onClick?: () => void;
}> = ({ day, isToday = false, assigneeIds = [], onClick }) => {
  const { isDark } = useTheme();
  const hasAssignees = assigneeIds.length > 0;

  return (
    <div className="p-1 flex flex-col items-center" onClick={onClick}>
      <div
        className={`
        ${
          isToday
            ? 'bg-blue-500 text-white'
            : hasAssignees
              ? isDark
                ? 'bg-gray-700'
                : 'bg-gray-100'
              : isDark
                ? 'text-gray-400'
                : 'text-gray-600'
        }
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1
        ${hasAssignees ? (isDark ? 'ring-2 ring-blue-400/30' : 'ring-2 ring-blue-200') : ''}
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}
      `}
      >
        {day}
      </div>

      {hasAssignees && (
        <div className="flex justify-center -mt-1">
          <TaskAssignees assigneeIds={assigneeIds} maxVisible={2} size="sm" />
        </div>
      )}
    </div>
  );
};

const TasksAndFunnel: React.FC = () => {
  const { isDark } = useTheme();
  const { contacts = {} } = useContactStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const today = new Date().getDate();

  // Real data: tasks from the task store (due dates, linked contacts) and deals from the deal store
  const tasks = useTaskStore((state) => state.tasks) || [];
  const dealsRaw = useDealStore((state) => state.deals);
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const tasksDueOn = (date: Date) =>
    tasks.filter((t) => {
      if (!t.dueDate || t.status === 'cancelled') return false;
      const due = new Date(t.dueDate);
      return (
        due.getFullYear() === date.getFullYear() &&
        due.getMonth() === date.getMonth() &&
        due.getDate() === date.getDate()
      );
    });
  const contactIdsOf = (list: typeof tasks) =>
    Array.from(new Set(list.map((t) => t.contactId).filter(Boolean) as string[]));

  const calendarData = Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => ({
    day,
    assigneeIds: contactIdsOf(tasksDueOn(new Date(now.getFullYear(), now.getMonth(), day))),
  }));

  // This week (Mon-Sun)
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const taskData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const due = tasksDueOn(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    return { day, tasks: due.length, assigneeIds: contactIdsOf(due) };
  });

  // Stage funnel from open deals: total pipeline plus the three largest stages by value
  const dealList: any[] = Array.isArray(dealsRaw) ? dealsRaw : Object.values(dealsRaw || {});
  const openDeals = dealList.filter((d) => !['closed-won', 'closed-lost'].includes(d.stage?.id));
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const byStage = new Map<string, number>();
  openDeals.forEach((d) => {
    const stage = d.stage?.name || d.stage?.id || 'unknown';
    byStage.set(stage, (byStage.get(stage) || 0) + (Number(d.value) || 0));
  });
  const shades = ['bg-gray-500', 'bg-gray-400', 'bg-gray-300'];
  const titleCase = (stage: string) =>
    stage
      .split(/[-_ ]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const funnelData = [
    {
      stage: 'Total in Pipeline',
      value: money(openDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)),
      color: 'bg-gray-600',
    },
    ...[...byStage.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([stage, value], i) => ({ stage: titleCase(stage), value: money(value), color: shades[i] })),
  ];

  const handleAssigneeClick = (id: string) => {
    // In a real implementation, this would open the contact details modal
    // You could call the onContactsClick function from props here
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // In a real implementation, this might open a modal to create/view tasks for this day
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Tasks Schedule */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tasks Schedule
          </h3>
          <div className="flex space-x-2">
            <button
              className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            {monthName}
          </h4>
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {calendarData.map(({ day, assigneeIds }) => (
              <CalendarDay
                key={day}
                day={day}
                isToday={day === today}
                assigneeIds={assigneeIds}
                onClick={() => handleDayClick(day)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {taskData.map((task, index) => (
            <div
              key={index}
              className={`flex items-center justify-between ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} p-3 rounded-lg transition-colors`}
            >
              <div className="flex items-center space-x-3">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {task.day}
                </div>
                <TaskAssignees assigneeIds={task.assigneeIds} onClick={handleAssigneeClick} />
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.tasks} tasks
                </span>
                <button
                  className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'} rounded transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className={`mt-4 p-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                {monthName} {selectedDay}
              </h5>
              <button
                className={`p-1 ${isDark ? 'text-blue-400 hover:bg-blue-500/20' : 'text-blue-600 hover:bg-blue-100'} rounded`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {calendarData[selectedDay - 1].assigneeIds.length > 0
                ? `${calendarData[selectedDay - 1].assigneeIds.length} assignees with scheduled tasks`
                : 'No tasks scheduled for this day'}
            </p>
            {calendarData[selectedDay - 1].assigneeIds.length > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <TaskAssignees
                  assigneeIds={calendarData[selectedDay - 1].assigneeIds}
                  maxVisible={5}
                  onClick={handleAssigneeClick}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stage Funnel */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Stage Funnel
          </h3>
          <div className="flex space-x-2">
            <button
              className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {funnelData.map((stage, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {stage.stage}
                </span>
                <span
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {stage.value}
                </span>
              </div>
              <div className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                <div
                  className={`${stage.color} ${isDark ? 'opacity-80' : 'opacity-100'} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${(4 - index) * 25}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Weighted
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Total
            </span>
          </div>
        </div>

        {/* Added Team Overview */}
        <div className={`mt-4 p-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg`}>
          <div className="flex items-center justify-between mb-3">
            <h4
              className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'} flex items-center`}
            >
              <Users className="w-4 h-4 mr-2" />
              Team Assignments
            </h4>
            <button
              className={`p-1 rounded ${isDark ? 'hover:bg-blue-500/20 text-blue-300' : 'hover:bg-blue-100 text-blue-700'}`}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {/* Get unique assignees from all tasks */}
            {Array.from(new Set(taskData.flatMap((t) => t.assigneeIds)))
              .filter((id) => contacts[id]) // Filter out invalid IDs
              .map((assigneeId) => {
                const contact = contacts[assigneeId];
                const taskCount = taskData.filter((t) => t.assigneeIds.includes(assigneeId)).length;

                // Map interestLevel to status
                let status: 'online' | 'away' | 'offline' = 'offline';
                if (contact.interestLevel === 'hot') status = 'online';
                else if (contact.interestLevel === 'warm' || contact.interestLevel === 'medium')
                  status = 'away';

                return (
                  <div key={assigneeId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        src={contact.avatarSrc || contact.avatar}
                        alt={contact.name}
                        size="sm"
                        status={status}
                      />
                      <span
                        className={`text-sm font-medium ${isDark ? 'text-blue-100' : 'text-blue-800'}`}
                      >
                        {contact.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${isDark ? 'text-blue-300 bg-blue-500/30' : 'text-blue-700 bg-blue-100'} px-2 py-1 rounded`}
                    >
                      {taskCount} days
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksAndFunnel;

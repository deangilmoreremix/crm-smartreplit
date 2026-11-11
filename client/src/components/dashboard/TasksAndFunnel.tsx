import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useTaskStore } from '../../store/taskStore';
import { useDealStore } from '../../store/dealStore';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import SampleBadge from '../SampleBadge';
import { ArrowRight, Users } from 'lucide-react';
import Avatar from '../ui/Avatar';

export interface DayInfo {
  assigneeIds: string[];
  taskCount: number;
  titles: string[];
}

const EMPTY_DAY: DayInfo = { assigneeIds: [], taskCount: 0, titles: [] };
const SAMPLE_CONTACT_IDS = ['1', '2', '3', '4', '5'];

export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Deterministic sample schedule: same date -> same assignees, no randomness. */
export function sampleDayInfo(d: Date): DayInfo {
  const day = d.getDate();
  if (!(day % 3 === 0 || day % 7 === 2)) return EMPTY_DAY;
  const count = (day % 4) + 1;
  return { assigneeIds: SAMPLE_CONTACT_IDS.slice(0, count), taskCount: count, titles: [] };
}

/** Group open/closed tasks by local due date. Assignees are the tasks' linked contacts. */
export function groupTasksByDay(
  tasks: { title: string; dueDate?: Date | string; contactId?: string }[]
): Map<string, DayInfo> {
  const map = new Map<string, DayInfo>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const when = new Date(t.dueDate);
    if (Number.isNaN(when.getTime())) continue;
    const key = dateKey(when);
    const info = map.get(key) ?? { assigneeIds: [], taskCount: 0, titles: [] };
    info.taskCount += 1;
    info.titles.push(t.title);
    if (t.contactId && !info.assigneeIds.includes(t.contactId)) info.assigneeIds.push(t.contactId);
    map.set(key, info);
  }
  return map;
}

/** Calendar layout for a month: real days-in-month and the weekday of the 1st (0 = Sunday). */
export function monthLayout(year: number, month: number) {
  return {
    daysInMonth: new Date(year, month + 1, 0).getDate(),
    leadingBlanks: new Date(year, month, 1).getDay(),
  };
}

const FUNNEL_STAGES = [
  { id: 'qualification', name: 'Qualification', color: 'bg-gray-500' },
  { id: 'proposal', name: 'Proposal', color: 'bg-gray-400' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-gray-300' },
];

/** Funnel numbers from deals: open value per stage, total open pipeline and its weighted value. */
export function computeFunnel(
  deals: { value: number; probability?: number; stage?: { id: string } }[]
) {
  const stages = FUNNEL_STAGES.map((st) => ({
    ...st,
    value: deals.filter((d) => d.stage?.id === st.id).reduce((n, d) => n + (d.value || 0), 0),
  }));
  const open = deals.filter((d) => d.stage?.id !== 'closed-won' && d.stage?.id !== 'closed-lost');
  return {
    stages,
    total: open.reduce((n, d) => n + (d.value || 0), 0),
    weighted: open.reduce((n, d) => n + ((d.value || 0) * (d.probability ?? 0)) / 100, 0),
  };
}

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// Component to display assignee avatars
const TaskAssignees: React.FC<{
  assigneeIds: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}> = ({ assigneeIds, maxVisible = 3, size = 'sm' }) => {
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
            className="relative hover:z-10 transition-all hover:transform hover:scale-110"
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
  const navigate = useNavigate();
  const contacts = useContactStore((s) => s.contacts) ?? {};
  const tasks = useTaskStore((s) => s.tasks);
  const deals = useDealStore((s) => s.deals);
  const { showDemoData } = useDemoDataSafe();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const { daysInMonth, leadingBlanks } = monthLayout(year, month);

  const realByDay = useMemo(() => groupTasksByDay(tasks ?? []), [tasks]);
  const hasRealTasks = realByDay.size > 0;
  const useSampleTasks = !hasRealTasks && showDemoData;
  const infoFor = (d: Date): DayInfo =>
    useSampleTasks ? sampleDayInfo(d) : (realByDay.get(dateKey(d)) ?? EMPTY_DAY);

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    ...infoFor(new Date(year, month, i + 1)),
  }));

  // Monday-Sunday of the current week, limited to this month's tasks view
  const mondayOffset = (now.getDay() + 6) % 7;
  const weekRows = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(year, month, today - mondayOffset + i);
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), ...infoFor(d) };
  });

  const teamIds = Array.from(new Set(monthDays.flatMap((d) => d.assigneeIds))).filter(
    (id) => contacts[id]
  );

  const hasRealDeals = (deals ?? []).some((d) => !d.isDemo);
  const hasSampleDeals = (deals ?? []).some((d) => d.isDemo);
  const funnel = computeFunnel(deals ?? []);
  const maxStage = Math.max(1, ...funnel.stages.map((st) => st.value));

  const selected = selectedDay ? monthDays[selectedDay - 1] : null;
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Tasks Schedule */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Tasks Schedule
            {useSampleTasks && <SampleBadge className="ml-2 align-middle" />}
          </h3>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            aria-label="Open tasks"
            className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <h4
            className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}
            data-testid="calendar-month"
          >
            {monthName} {year}
          </h4>
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm" data-testid="calendar-grid">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {monthDays.map(({ day, assigneeIds }) => (
              <CalendarDay
                key={day}
                day={day}
                isToday={day === today}
                assigneeIds={assigneeIds}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              />
            ))}
          </div>
        </div>

        {!hasRealTasks && !useSampleTasks && (
          <p className={`text-sm ${muted}`} data-testid="tasks-schedule-empty">
            No tasks scheduled yet.
          </p>
        )}

        <div className="space-y-3">
          {(hasRealTasks || useSampleTasks) &&
            weekRows.map((row, index) => (
              <div
                key={index}
                className={`flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'} p-3 rounded-lg`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    {row.label}
                  </div>
                  <TaskAssignees assigneeIds={row.assigneeIds} />
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {row.taskCount} tasks
                </span>
              </div>
            ))}
        </div>

        {/* Selected Day Details */}
        {selected && (
          <div className={`mt-4 p-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg`}>
            <h5 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              {monthName} {selectedDay}
            </h5>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {selected.taskCount > 0
                ? `${selected.taskCount} task${selected.taskCount === 1 ? '' : 's'} scheduled`
                : 'No tasks scheduled for this day'}
            </p>
            {selected.titles.length > 0 && (
              <ul
                className={`mt-1 text-sm list-disc pl-5 ${isDark ? 'text-blue-200' : 'text-blue-700'}`}
              >
                {selected.titles.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Stage Funnel */}
      <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Stage Funnel
            {hasSampleDeals && <SampleBadge className="ml-2 align-middle" />}
          </h3>
          <button
            type="button"
            onClick={() => navigate('/pipeline')}
            aria-label="Open pipeline"
            className={`p-2 ${isDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {!hasRealDeals && !hasSampleDeals ? (
          <p className={`text-sm ${muted}`} data-testid="funnel-empty">
            No deals in the pipeline yet.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Total in Pipeline
                </span>
                <span
                  className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {money(funnel.total)}
                </span>
              </div>
              {funnel.stages.map((stage) => (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {stage.name}
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      {money(stage.value)}
                    </span>
                  </div>
                  <div
                    className={`w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}
                  >
                    <div
                      className={`${stage.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(stage.value / maxStage) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-6 p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Weighted {money(funnel.weighted)}
                </span>
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Total {money(funnel.total)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Team Overview: contacts linked to scheduled tasks */}
        <div className={`mt-4 p-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'} rounded-lg`}>
          <h4
            className={`font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-900'} flex items-center`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Assignments
          </h4>
          {teamIds.length === 0 && (
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
              No assignments yet.
            </p>
          )}
          <div className="space-y-3">
            {teamIds.map((assigneeId) => {
              const contact = contacts[assigneeId];
              const taskCount = monthDays.filter((d) => d.assigneeIds.includes(assigneeId)).length;
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

import React from 'react';
import TaskCard from './TaskCard';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Plus } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useDemoDataSafe } from '../contexts/DemoDataContext';
import SampleBadge from './SampleBadge';

const CARD_TYPES = ['meeting', 'proposal', 'call', 'follow-up'] as const;
type CardType = (typeof CARD_TYPES)[number];
const toCardType = (t: string): CardType =>
  (CARD_TYPES as readonly string[]).includes(t) ? (t as CardType) : 'follow-up';
const toCardPriority = (p: string): 'high' | 'medium' | 'low' =>
  p === 'urgent' || p === 'high' ? 'high' : p === 'low' ? 'low' : 'medium';

const TasksSection = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { showDemoData } = useDemoDataSafe();
  const storeTasks = useTaskStore((s) => s.tasks);

  const realTasks = (storeTasks ?? [])
    .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
    .sort(
      (a, b) =>
        (a.dueDate ? +new Date(a.dueDate) : Infinity) -
        (b.dueDate ? +new Date(b.dueDate) : Infinity)
    )
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : undefined,
      type: toCardType(t.type),
      status: t.status,
      priority: toCardPriority(t.priority),
      dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      ...(t.assignedUserName ? { assignee: { name: t.assignedUserName, role: '' } } : {}),
    }));

  const sampleTasks = [
    {
      id: '1',
      title: 'Google Meet Call',
      subtitle: '28.03.2023 at 2 pm',
      assignee: {
        name: 'Peter Thomas',
        role: 'CEO at MediaInk',
        avatar:
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      type: 'meeting' as const,
      status: 'Call scheduled',
      priority: 'high' as const,
      isHighlighted: true,
    },
    {
      id: '2',
      title: 'Send Proposal',
      subtitle: 'Amount: $20,000',
      assignee: {
        name: 'Alesha Hyacinth',
        role: 'Chief Operations Officer',
        avatar:
          'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      type: 'proposal' as const,
      status: 'Waiting Proposal',
      priority: 'medium' as const,
    },
    {
      id: '3',
      title: 'Google Meet Call',
      subtitle: '28.03.2023 at 8 pm',
      assignee: {
        name: 'Miriam Farmer',
        role: 'Brand Manager at Servant Wizardry',
        avatar:
          'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      },
      type: 'call' as const,
      status: 'Call scheduled',
      priority: 'medium' as const,
    },
  ];

  const isSample = realTasks.length === 0 && showDemoData;
  const tasks = realTasks.length ? realTasks : showDemoData ? sampleTasks : [];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Days Tasks
            {isSample && <SampleBadge className="ml-2 align-middle" />}
          </h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {tasks?.length || 0} active tasks
          </p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
            isDark
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          } transition-colors`}
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {tasks.length === 0 && (
        <p
          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          data-testid="tasks-empty"
        >
          No tasks yet. Create one with New Task.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
};

export default TasksSection;

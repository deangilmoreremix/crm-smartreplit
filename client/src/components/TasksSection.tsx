import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Plus } from 'lucide-react';

const TasksSection = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const tasks = [
    {
      id: '1',
      title: 'Google Meet Call',
      subtitle: '28.03.2023 at 2 pm',
      assignee: {
        name: 'Peter Thomas',
        role: 'CEO at MediaInk',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      type: 'meeting' as const,
      status: 'Call scheduled',
      priority: 'high' as const,
      isHighlighted: true
    },
    {
      id: '2',
      title: 'Send Proposal',
      subtitle: 'Amount: $20,000',
      assignee: {
        name: 'Alesha Hyacinth',
        role: 'Chief Operations Officer',
        avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      type: 'proposal' as const,
      status: 'Waiting Proposal',
      priority: 'medium' as const
    },
    {
      id: '3',
      title: 'Google Meet Call',
      subtitle: '28.03.2023 at 8 pm',
      assignee: {
        name: 'Miriam Farmer',
        role: 'Brand Manager at Servant Wizardry',
        avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
      },
      type: 'call' as const,
      status: 'Call scheduled',
      priority: 'medium' as const
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Your Days Tasks</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tasks?.length || 0} active tasks</p>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
            isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'
          } transition-colors`}
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
};

export default TasksSection;
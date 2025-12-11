import React from 'react';
import { Calendar, Clock, Mail, Video, FileText, MoreHorizontal, CheckCircle, Check, MoreVertical } from 'lucide-react';
import Avatar from './ui/Avatar';
import { useTaskStore } from '../store/taskStore';
import { getInitials, getAvatarByIndex } from '../utils/avatars';
import { useTheme } from '../contexts/ThemeContext';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    subtitle?: string;
    assignee?: {
      name: string;
      role: string;
      avatar?: string;
    };
    type: 'meeting' | 'proposal' | 'call' | 'follow-up';
    status: string;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: Date;
    isHighlighted?: boolean;
    completed?: boolean;
  };
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { isDark } = useTheme();
  const { updateTask } = useTaskStore();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const getCardClass = (highlighted: boolean) => {
    if (highlighted) {
      return `${isDark ? 'bg-gradient-to-br from-green-400/20 to-emerald-500/20 border-green-400/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`;
    }
    return `${isDark ? 'bg-gray-800/50 border-white/10' : 'bg-white border-gray-200'}`;
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'meeting': return isDark ? 'text-green-400' : 'text-green-600';
      case 'call': return isDark ? 'text-blue-400' : 'text-blue-600';
      case 'proposal': return isDark ? 'text-purple-400' : 'text-purple-600';
      default: return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return Video;
      case 'call': return Video;
      case 'proposal': return FileText;
      default: return CheckCircle;
    }
  };

  const handleCompleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Auto-trigger AI insights and next actions without user intervention
    if (task.assistantThreadId) {
      try {
        const { aiOrchestrator } = await import('../services/ai-orchestrator.service');
        
        // Submit multiple AI requests in background
        await Promise.all([
          // Task completion analysis
          aiOrchestrator.submitRequest({
            type: 'task_completion_analysis',
            priority: 'medium',
            data: {
              taskId: task.id,
              assistantThreadId: task.assistantThreadId,
              completionStatus: !task.completed,
              context: {
                contactId: task.contactId,
                dealId: task.dealId,
                completedAt: new Date()
              }
            }
          }),
          
          // Auto-generate follow-up recommendations
          aiOrchestrator.submitRequest({
            type: 'automation_suggestions',
            priority: 'low',
            data: {
              entityType: 'task',
              entityId: task.id,
              action: 'completion',
              context: { contactId: task.contactId, dealId: task.dealId }
            }
          }),
          
          // Update contact engagement score
          task.contactId && aiOrchestrator.submitRequest({
            type: 'contact_scoring',
            priority: 'low',
            data: { contactId: task.contactId, activityType: 'task_completion' }
          })
        ]);
      } catch (error) {
        console.warn('Assistant thread update failed:', error);
      }
    }
    
    updateTask(task.id, { completed: !task.completed });
  };

  const TypeIcon = getTypeIcon(task.type);

  // Generate avatar for assignee if not provided
  const assigneeAvatar = task.assignee?.avatar || getAvatarByIndex(index, 'executives');

  return (
    <div 
      className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} backdrop-blur-xl border rounded-2xl p-6 hover:${isDark ? 'bg-gray-800/70' : 'bg-gray-50'} transition-all duration-300 group ${getCardClass(task.isHighlighted)} ${task.completed ? 'opacity-70' : ''} relative`}
      onClick={() => window.location.href = `/tasks/${task.id}`}
    >
      {task.completed && (
        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
          <Check size={12} />
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Avatar 
            src={assigneeAvatar}
            alt={task.assignee?.name || `User ${index}`}
            size="md"
            fallback={getInitials(task.assignee?.name || `User ${index}`)}
            status="online"
          />
          <div>
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task.assignee?.name || `Team Member ${index + 1}`}
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {task.assignee?.role || 'Sales Representative'}
            </p>
          </div>
        </div>
        <button 
          className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors opacity-0 group-hover:opacity-100 relative`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreVertical className="h-4 w-4" />
          
          {menuOpen && (
            <div className={`absolute right-0 mt-1 w-36 ${
              isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-gray-200'
            } border rounded-lg shadow-lg z-10 py-1`}>
              <button 
                className={`w-full text-left px-3 py-2 text-sm ${
                  isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-700'
                } flex items-center space-x-2`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteTask(e);
                }}
              >
                <CheckCircle size={14} className={task.completed ? 'text-green-400' : 'text-gray-400'} />
                <span>{task.completed ? 'Mark Incomplete' : 'Mark Complete'}</span>
              </button>
              
              <button 
                className={`w-full text-left px-3 py-2 text-sm ${
                  isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-gray-700'
                } flex items-center space-x-2`}
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/tasks/${task.id}/edit`;
                }}
              >
                <FileText size={14} className="text-gray-400" />
                <span>Edit Task</span>
              </button>
            </div>
          )}
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'} ${getIconColor(task.type)}`}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'} transition-colors`}>
              {task.title}
            </h4>
            {task.subtitle && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10' : 'bg-gray-100'} ${getIconColor(task.type)}`}>
              {task.status}
            </span>
            {task.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.priority === 'high' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800') :
                task.priority === 'medium' ? (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800') :
                (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800')
              }`}>
                {task.priority}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button className={`p-2 ${isDark ? 'bg-white/10 hover:bg-green-400/20' : 'bg-gray-100 hover:bg-green-100'} rounded-lg transition-colors`}>
              <Mail className={`h-4 w-4 ${isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`} />
            </button>
            {task.type === 'meeting' && (
              <button className={`p-2 ${isDark ? 'bg-white/10 hover:bg-green-400/20' : 'bg-gray-100 hover:bg-green-100'} rounded-lg transition-colors`}>
                <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Plus, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  MessageSquare,
  Paperclip,
  Filter,
  Search,
  Phone,
  FileText,
  Settings
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { TaskDetailsModal } from './TaskDetailsModal';

const statusColumns = [
  { id: 'pending', title: 'To Do', color: 'bg-gray-100', headerColor: 'bg-gray-50' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100', headerColor: 'bg-blue-50' },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-yellow-100', headerColor: 'bg-yellow-50' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100', headerColor: 'bg-green-50' },
] as const;

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const typeIcons = {
  'follow-up': Clock,
  'meeting': Calendar,
  'call': Phone,
  'email': MessageSquare,
  'proposal': FileText,
  'research': Search,
  'administrative': Settings,
  'other': Plus,
};

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'completed';
  const isDueToday = task.dueDate && 
    task.dueDate.toDateString() === new Date().toDateString();

  const TypeIcon = typeIcons[task.type] || Plus;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
          onClick={onClick}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TypeIcon className="h-4 w-4 text-gray-500" />
                <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                  {task.priority.toUpperCase()}
                </Badge>
              </div>
              {task.attachments.length > 0 && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
            </div>

            {/* Title */}
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Subtasks Progress */}
            {task.subtasks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Subtasks</span>
                  <span>
                    {task.subtasks.filter(s => s.status === 'completed').length}/
                    {task.subtasks.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (task.subtasks.filter(s => s.status === 'completed').length / 
                         task.subtasks.length) * 100
                      }%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
              {/* Assignee */}
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600 truncate max-w-20">
                  {task.assignedUserName || 'Unassigned'}
                </span>
              </div>

              {/* Due Date */}
              {task.dueDate && (
                <div className={`flex items-center space-x-1 ${
                  isOverdue ? 'text-red-600' : isDueToday ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>
                    {task.dueDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Estimated Duration */}
            {task.estimatedDuration && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedDuration}min</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

interface ColumnHeaderProps {
  column: typeof statusColumns[0];
  taskCount: number;
  onAddTask: () => void;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, taskCount, onAddTask }) => (
  <div className={`p-4 rounded-t-lg ${column.headerColor} border-b`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <h3 className="font-semibold text-gray-800">{column.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {taskCount}
        </Badge>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onAddTask}
        className="h-6 w-6 p-0 hover:bg-white/50"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const TaskKanbanBoard: React.FC = () => {
  const { 
    getFilteredTasks, 
    updateTask, 
    filters, 
    setFilters,
    setSelectedTask,
    selectedTask 
  } = useTaskStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<Task['status'] | null>(null);

  const tasks = getFilteredTasks();

  // Update search filter when search term changes
  useEffect(() => {
    if (setFilters) {
      setFilters({ searchTerm: searchTerm || undefined });
    }
  }, [searchTerm, setFilters]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    await updateTask(draggableId, { status: newStatus });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAddTask = (status: Task['status']) => {
    setNewTaskStatus(status);
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const closeModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
    setNewTaskStatus(null);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600">Manage and track your tasks</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filters */}
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {filters && Object.keys(filters).length > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="font-medium">
                Priority
              </DropdownMenuItem>
              {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={filters?.priorities?.includes(priority) || false}
                  onCheckedChange={(checked) => {
                    const priorities = filters?.priorities || [];
                    if (setFilters) {
                      setFilters({
                        priorities: checked
                          ? [...priorities, priority]
                          : priorities.filter(p => p !== priority)
                      });
                    }
                  }}
                >
                  <span className="capitalize">{priority}</span>
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuCheckboxItem
                checked={filters?.isOverdue || false}
                onCheckedChange={(checked) => setFilters && setFilters({ isOverdue: checked })}
              >
                Overdue Tasks
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={filters?.isDueToday || false}
                onCheckedChange={(checked) => setFilters && setFilters({ isDueToday: checked })}
              >
                Due Today
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setFilters && setFilters({})}>
                Clear All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Task */}
          <Button onClick={() => handleAddTask('pending')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-6 h-full">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              
              return (
                <div key={column.id} className="flex flex-col h-full">
                  <ColumnHeader
                    column={column}
                    taskCount={columnTasks.length}
                    onAddTask={() => handleAddTask(column.id)}
                  />
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 rounded-b-lg transition-colors ${
                          column.color
                        } ${
                          snapshot.isDraggingOver ? 'bg-opacity-50' : ''
                        }`}
                        style={{ minHeight: '500px' }}
                      >
                        {columnTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onClick={() => handleTaskClick(task)}
                          />
                        ))}
                        {provided.placeholder}
                        
                        {columnTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <CheckCircle2 className="h-8 w-8 mb-2" />
                            <p className="text-sm">No tasks</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Task Details Modal */}
      {showTaskModal && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={closeModal}
          defaultStatus={newTaskStatus || undefined}
        />
      )}
    </div>
  );
};

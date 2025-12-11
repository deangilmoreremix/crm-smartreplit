import React, { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  List, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Trash2,
  Edit,
  Flag,
  MessageSquare,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

const Tasks: React.FC = () => {
  const { 
    tasks, 
    isLoading,
    createTask, 
    updateTask, 
    deleteTask, 
    markTaskComplete,
    selectTask,
    selectedTask
  } = useTaskStore();
  
  const [filter, setFilter] = useState<{
    status: 'all' | 'completed' | 'uncompleted';
    priority: 'all' | 'high' | 'medium' | 'low';
    dateRange: 'all' | 'overdue' | 'today' | 'thisWeek';
  }>({
    status: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  
  const [sortBy, setSortBy] = useState<{
    field: 'dueDate' | 'priority' | 'title';
    direction: 'asc' | 'desc';
  }>({
    field: 'dueDate',
    direction: 'asc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: undefined,
    priority: 'medium',
    completed: false,
    category: 'follow-up'
  });
  
  // Filter tasks based on selected filters and search term
  const filteredTasks = Object.values(tasks).filter(task => {
    // Check search term
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Check status filter
    if (
      (filter.status === 'completed' && !task.completed) ||
      (filter.status === 'uncompleted' && task.completed)
    ) {
      return false;
    }
    
    // Check priority filter
    if (filter.priority !== 'all' && task.priority !== filter.priority) {
      return false;
    }
    
    // Check date filter
    if (filter.dateRange !== 'all' && task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      
      if (filter.dateRange === 'overdue' && (task.completed || task.dueDate >= today)) {
        return false;
      } else if (filter.dateRange === 'today' && (
        task.dueDate < today || task.dueDate >= tomorrow
      )) {
        return false;
      } else if (filter.dateRange === 'thisWeek' && (
        task.dueDate < today || task.dueDate > endOfWeek
      )) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort the filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy.field === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortBy.direction === 'asc' ? 1 : -1;
      if (!b.dueDate) return sortBy.direction === 'asc' ? -1 : 1;
      return sortBy.direction === 'asc' 
        ? a.dueDate.getTime() - b.dueDate.getTime()
        : b.dueDate.getTime() - a.dueDate.getTime();
    }
    
    if (sortBy.field === 'priority') {
      const priorityOrder = { high: 2, medium: 1, low: 0 };
      const aValue = priorityOrder[a.priority] || 0;
      const bValue = priorityOrder[b.priority] || 0;
      return sortBy.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Default to sorting by title
    return sortBy.direction === 'asc'
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title);
  });
  
  // Group tasks for display
  const groupedTasks = {
    overdue: sortedTasks.filter(
      task => !task.completed && task.dueDate && task.dueDate < new Date()
    ),
    today: sortedTasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return task.dueDate >= today && task.dueDate < tomorrow;
    }),
    upcoming: sortedTasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return task.dueDate >= tomorrow;
    }),
    completed: sortedTasks.filter(task => task.completed),
    noDueDate: sortedTasks.filter(task => !task.completed && !task.dueDate)
  };
  
  // Open task detail or create form
  const openTaskDetail = (id: string) => {
    selectTask(id);
    const task = tasks[id];
    setEditMode(false);
    setTaskForm(task);
    setShowTaskModal(true);
  };
  
  // Open task creation form
  const openCreateForm = () => {
    selectTask(null);
    setEditMode(false);
    setTaskForm({
      title: '',
      description: '',
      dueDate: undefined,
      priority: 'medium',
      completed: false,
      category: 'follow-up'
    });
    setShowTaskModal(true);
  };
  
  // Submit task form (create or update)
  const handleSubmit = async () => {
    if (selectedTask) {
      // Update existing task
      await updateTask(selectedTask, taskForm);
    } else {
      // Create new task
      await createTask(taskForm);
    }
    
    setShowTaskModal(false);
  };
  
  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'No due date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date < today) {
      return `Overdue: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= today && date < tomorrow) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 86400000)) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  // Priority badge
  const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[priority]} capitalize`}>
        {priority}
      </span>
    );
  };
  
  // Category badge
  const CategoryBadge = ({ category }: { category: string }) => {
    const colors: Record<string, string> = {
      'call': 'bg-purple-100 text-purple-800',
      'email': 'bg-blue-100 text-blue-800',
      'meeting': 'bg-indigo-100 text-indigo-800',
      'follow-up': 'bg-amber-100 text-amber-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[category] || colors.other} capitalize`}>
        {category.replace('-', ' ')}
      </span>
    );
  };
  
  // Task group component
  const TaskGroup = ({ title, tasks, icon }: { title: string; tasks: Task[]; icon: React.ReactNode }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
          <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
        </h3>
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 p-3 transition-all cursor-pointer"
              onClick={() => openTaskDetail(task.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        markTaskComplete(task.id, e.target.checked);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {(task.dueDate || task.priority) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {task.dueDate && (
                          <div className="flex items-center text-xs">
                            <Clock size={12} className="mr-1 text-gray-400" />
                            <span className={
                              !task.completed && task.dueDate < new Date() 
                                ? 'text-red-600 font-medium' 
                                : 'text-gray-500'
                            }>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                        
                        {task.priority && (
                          <PriorityBadge priority={task.priority} />
                        )}
                        
                        {task.category && (
                          <CategoryBadge category={task.category} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your tasks and follow-ups</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Link
            to="/tasks/calendar"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Calendar size={18} className="mr-1.5" />
            Calendar View
          </Link>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1.5" />
            Add Task
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Task count summary cards */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
            <CheckSquare size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-xl font-semibold">{Object.keys(tasks).length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 mr-3">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-xl font-semibold">
              {Object.values(tasks).filter(
                task => !task.completed && task.dueDate && task.dueDate < new Date()
              ).length}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mr-3">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-xl font-semibold">
              {Object.values(tasks).filter(task => task.completed).length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-lg font-medium text-gray-900">Task List</h2>
            
            <div className="flex space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="relative">
                <select 
                  value={filter.priority} 
                  onChange={(e) => setFilter({...filter, priority: e.target.value as any})}
                  className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              
              <div className="relative">
                <select 
                  value={filter.status} 
                  onChange={(e) => setFilter({...filter, status: e.target.value as any})}
                  className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="uncompleted">Uncompleted</option>
                </select>
              </div>
              
              <div className="relative">
                <select 
                  value={filter.dateRange} 
                  onChange={(e) => setFilter({...filter, dateRange: e.target.value as any})}
                  className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {/* Tasks lists by group */}
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="py-10 text-center">
              <CheckSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="text-sm text-gray-500 mt-2">Create a new task to get started</p>
              <button
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} className="mr-1.5" />
                Add Task
              </button>
            </div>
          ) : (
            <div>
              <TaskGroup 
                title="Overdue" 
                tasks={groupedTasks.overdue}
                icon={<AlertCircle size={20} className="text-red-500" />}
              />
              
              <TaskGroup 
                title="Today" 
                tasks={groupedTasks.today}
                icon={<Clock size={20} className="text-blue-500" />}
              />
              
              <TaskGroup 
                title="Upcoming" 
                tasks={groupedTasks.upcoming}
                icon={<Calendar size={20} className="text-indigo-500" />}
              />
              
              <TaskGroup 
                title="No Due Date" 
                tasks={groupedTasks.noDueDate}
                icon={<CheckSquare size={20} className="text-gray-500" />}
              />
              
              <TaskGroup 
                title="Completed" 
                tasks={groupedTasks.completed}
                icon={<CheckCircle size={20} className="text-green-500" />}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Task Detail/Create Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedTask ? (editMode ? 'Edit Task' : 'Task Details') : 'Create New Task'}
                      </h3>
                      <button
                        onClick={() => setShowTaskModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    {(editMode || !selectedTask) ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Task Title
                          </label>
                          <input
                            id="title"
                            type="text"
                            value={taskForm.title || ''}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <SimpleMDE
                            value={taskForm.description || ''}
                            onChange={(value) => setTaskForm({...taskForm, description: value})}
                            options={{
                              placeholder: 'Task description or notes',
                              status: false,
                              spellChecker: false,
                              toolbar: ["bold", "italic", "heading", "|", "unordered-list", "ordered-list", "|", "link"],
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                              Due Date
                            </label>
                            <input
                              id="dueDate"
                              type="datetime-local"
                              value={taskForm.dueDate ? new Date(taskForm.dueDate.getTime() - taskForm.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                              Priority
                            </label>
                            <select
                              id="priority"
                              value={taskForm.priority}
                              onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as 'high' | 'medium' | 'low'})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            id="category"
                            value={taskForm.category}
                            onChange={(e) => setTaskForm({...taskForm, category: e.target.value as any})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="meeting">Meeting</option>
                            <option value="follow-up">Follow-up</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="completed"
                            type="checkbox"
                            checked={taskForm.completed || false}
                            onChange={(e) => setTaskForm({...taskForm, completed: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
                            Mark as completed
                          </label>
                        </div>
                      </div>
                    ) : selectedTask && tasks[selectedTask] ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-start">
                            <div className="pt-0.5">
                              <input
                                type="checkbox"
                                checked={tasks[selectedTask].completed}
                                onChange={(e) => markTaskComplete(selectedTask, e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                            </div>
                            <div className="ml-3">
                              <h4 className={`text-lg font-medium ${tasks[selectedTask].completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {tasks[selectedTask].title}
                              </h4>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                {tasks[selectedTask].dueDate && (
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock size={16} className="mr-1 text-gray-400" />
                                    <span className={
                                      !tasks[selectedTask].completed && 
                                      tasks[selectedTask].dueDate < new Date() 
                                        ? 'text-red-600 font-medium' 
                                        : 'text-gray-500'
                                    }>
                                      {formatDate(tasks[selectedTask].dueDate)}
                                    </span>
                                  </div>
                                )}
                                
                                {tasks[selectedTask].priority && (
                                  <PriorityBadge priority={tasks[selectedTask].priority} />
                                )}
                                
                                {tasks[selectedTask].category && (
                                  <CategoryBadge category={tasks[selectedTask].category} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {tasks[selectedTask].description && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded-md border border-gray-200">
                              <ReactMarkdown>{tasks[selectedTask].description}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                        
                        {tasks[selectedTask].relatedTo && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Related To</h4>
                            <div className="flex items-center">
                              {tasks[selectedTask].relatedTo.type === 'contact' ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <User size={16} className="mr-2 text-gray-400" />
                                  <span>Contact: John Doe</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Briefcase size={16} className="mr-2 text-gray-400" />
                                  <span>Deal: Enterprise License</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Created</h4>
                          <p className="text-sm text-gray-600">
                            {tasks[selectedTask].createdAt.toLocaleString()}
                          </p>
                        </div>
                        
                        {tasks[selectedTask].completedAt && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Completed</h4>
                            <p className="text-sm text-gray-600">
                              {tasks[selectedTask].completedAt.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {editMode || !selectedTask ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {selectedTask ? 'Update Task' : 'Create Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Edit Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteTask(selectedTask);
                          setShowTaskModal(false);
                        }
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components for the task list
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      colors[priority as keyof typeof colors] || colors.medium
    }`}>
      <Flag size={10} className="mr-1" />
      {priority}
    </span>
  );
};

export default Tasks;
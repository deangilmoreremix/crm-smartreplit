import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import TaskCalendar from '../components/TaskCalendar';
import { Task } from '../types';
import { 
  Plus, 
  List, 
  CheckSquare, 
  Calendar,
  Users,
  Briefcase,
  Flag,
  Clock,
  X,
  Edit,
  Trash2,
  Save,
  MessageSquare
} from 'lucide-react';
import Select from 'react-select';
import ReactMarkdown from 'react-markdown';

const TaskCalendarView: React.FC = () => {
  const { 
    tasks, 
    createTask, 
    updateTask, 
    deleteTask, 
    markTaskComplete, 
    selectTask,
    selectedTask
  } = useTaskStore();
  
  const [showTaskDetail, setShowTaskDetail] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium',
    category: 'follow-up',
    completed: false
  });
  
  useEffect(() => {
    // If a task is selected, populate the form with its data
    if (selectedTask && tasks[selectedTask]) {
      setFormData(tasks[selectedTask]);
    }
  }, [selectedTask, tasks]);
  
  const clearForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date(),
      priority: 'medium',
      category: 'follow-up',
      completed: false
    });
  };
  
  // Handle task selection from the calendar
  const handleTaskSelect = (task: Task) => {
    selectTask(task.id);
    setShowTaskDetail(true);
    setIsEditing(false);
  };
  
  // Submit form data (create or update)
  const handleSubmit = async () => {
    try {
      if (selectedTask && isEditing) {
        // Update existing task
        await updateTask(selectedTask, formData);
      } else {
        // Create new task
        await createTask(formData);
      }
      
      // Close forms and reset
      setShowTaskDetail(false);
      setIsEditing(false);
      setShowCreateForm(false);
      clearForm();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };
  
  // Priority options for select input
  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];
  
  // Category options for select input
  const categoryOptions = [
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'other', label: 'Other' },
  ];
  
  // Format dates for display
  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Calculate task statistics
  const taskStats = {
    total: Object.values(tasks).length,
    completed: Object.values(tasks).filter(task => task.completed).length,
    overdue: Object.values(tasks).filter(task => 
      !task.completed && task.dueDate && task.dueDate < new Date()
    ).length,
    dueToday: Object.values(tasks).filter(task => {
      if (!task.dueDate || task.completed) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return task.dueDate >= today && task.dueDate < tomorrow;
    }).length
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Calendar</h1>
          <p className="text-gray-600 mt-1">Visualize your tasks and deadlines</p>
        </div>
        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
          <Link
            to="/tasks"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <List size={18} className="mr-1.5" />
            List View
          </Link>
          <button
            onClick={() => {
              selectTask(null);
              clearForm();
              setShowCreateForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            <Plus size={18} className="mr-1.5" />
            Add Task
          </button>
        </div>
      </header>
      
      {/* Task Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold">{taskStats.total}</p>
            </div>
            <div className="p-2 rounded-md bg-blue-100 text-blue-600">
              <CheckSquare size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold">{taskStats.completed}</p>
            </div>
            <div className="p-2 rounded-md bg-green-100 text-green-600">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {taskStats.total > 0 && (
              `${Math.round((taskStats.completed / taskStats.total) * 100)}% complete`
            )}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold">{taskStats.overdue}</p>
            </div>
            <div className="p-2 rounded-md bg-red-100 text-red-600">
              <Clock size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-2xl font-semibold">{taskStats.dueToday}</p>
            </div>
            <div className="p-2 rounded-md bg-yellow-100 text-yellow-600">
              <Calendar size={20} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Calendar */}
      <TaskCalendar onTaskSelect={handleTaskSelect} />
      
      {/* Create Task Modal */}
      {showCreateForm && (
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
                      <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Task Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={formData.title || ''}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter task title"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          value={formData.description || ''}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter task description"
                        ></textarea>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Due Date
                          </label>
                          <input
                            id="dueDate"
                            type="datetime-local"
                            value={formData.dueDate ? new Date(formData.dueDate.getTime() - formData.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData({...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priority
                          </label>
                          <Select
                            id="priority"
                            options={priorityOptions}
                            value={priorityOptions.find(opt => opt.value === formData.priority)}
                            onChange={(selected) => setFormData({...formData, priority: selected?.value as 'high' | 'medium' | 'low' || 'medium'})}
                            placeholder="Select Priority"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <Select
                            id="category"
                            options={categoryOptions}
                            value={categoryOptions.find(opt => opt.value === formData.category)}
                            onChange={(selected) => setFormData({...formData, category: selected?.value as any || 'other'})}
                            placeholder="Select Category"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="flex items-end pb-2">
                          <div className="flex items-center h-5">
                            <input
                              id="completed"
                              type="checkbox"
                              checked={formData.completed || false}
                              onChange={(e) => setFormData({...formData, completed: e.target.checked})}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
                              Mark as completed
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Detail Modal */}
      {selectedTask && showTaskDetail && tasks[selectedTask] && (
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
                        {isEditing ? 'Edit Task' : 'Task Details'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowTaskDetail(false);
                          setIsEditing(false);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Task Title
                          </label>
                          <input
                            id="title"
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            id="description"
                            rows={4}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          ></textarea>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                              Due Date
                            </label>
                            <input
                              id="dueDate"
                              type="datetime-local"
                              value={formData.dueDate ? new Date(formData.dueDate.getTime() - formData.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                              onChange={(e) => setFormData({...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                              Priority
                            </label>
                            <Select
                              id="priority"
                              options={priorityOptions}
                              value={priorityOptions.find(opt => opt.value === formData.priority)}
                              onChange={(selected) => setFormData({...formData, priority: selected?.value as any || 'medium'})}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <Select
                              id="category"
                              options={categoryOptions}
                              value={categoryOptions.find(opt => opt.value === formData.category)}
                              onChange={(selected) => setFormData({...formData, category: selected?.value as any || 'other'})}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="flex items-end pb-2">
                            <div className="flex items-center h-5">
                              <input
                                id="completed"
                                type="checkbox"
                                checked={formData.completed || false}
                                onChange={(e) => setFormData({...formData, completed: e.target.checked})}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
                                Mark as completed
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={tasks[selectedTask].completed}
                            onChange={(e) => markTaskComplete(selectedTask, e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5"
                          />
                          <div className="ml-3">
                            <h4 className={`text-lg font-medium ${
                              tasks[selectedTask].completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}>
                              {tasks[selectedTask].title}
                            </h4>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {tasks[selectedTask].priority && (
                                <div className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                                  ${tasks[selectedTask].priority === 'high' ? 'bg-red-100 text-red-800' : 
                                    tasks[selectedTask].priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-green-100 text-green-800'}`
                                }>
                                  <Flag className="inline-block w-3 h-3 mr-1" />
                                  {tasks[selectedTask].priority} priority
                                </div>
                              )}
                              
                              {tasks[selectedTask].category && (
                                <div className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium capitalize">
                                  {tasks[selectedTask].category}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {tasks[selectedTask].dueDate && (
                          <div className="flex items-center space-x-2 mt-2 text-sm">
                            <Clock size={16} className="text-gray-400" />
                            <span className={
                              !tasks[selectedTask].completed && 
                              tasks[selectedTask].dueDate < new Date() 
                                ? 'text-red-600 font-medium' 
                                : 'text-gray-600'
                            }>
                              {formatDate(tasks[selectedTask].dueDate)}
                            </span>
                          </div>
                        )}
                        
                        {tasks[selectedTask].description && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <MessageSquare size={16} className="mr-1 text-gray-400" />
                              Description
                            </h4>
                            <div className="prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg">
                              <ReactMarkdown>{tasks[selectedTask].description}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                        
                        {tasks[selectedTask].relatedTo && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Related To</h4>
                            <div className="text-sm text-gray-600 flex items-center">
                              {tasks[selectedTask].relatedTo.type === 'contact' ? (
                                <>
                                  <Users size={16} className="mr-2 text-blue-500" />
                                  <span>Contact: John Doe</span>
                                </>
                              ) : (
                                <>
                                  <Briefcase size={16} className="mr-2 text-purple-500" />
                                  <span>Deal: Enterprise License</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
                          <div>
                            Created: {formatDate(tasks[selectedTask].createdAt)}
                          </div>
                          {tasks[selectedTask].completedAt && (
                            <div>
                              Completed: {formatDate(tasks[selectedTask].completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-300/20 shadow-sm text-sm font-semibold rounded-full text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                    >
                      <Save size={16} className="mr-1.5" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200/60 shadow-sm text-sm font-semibold rounded-full text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-300/20 shadow-sm text-sm font-semibold rounded-full text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                    >
                      <Edit size={16} className="mr-1.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this task?')) {
                          deleteTask(selectedTask);
                          setShowTaskDetail(false);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 border border-red-300/20 shadow-sm text-sm font-semibold rounded-full text-white hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    >
                      <Trash2 size={16} className="mr-1.5" />
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskDetail(false)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200/60 shadow-sm text-sm font-semibold rounded-full text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
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

export default TaskCalendarView;
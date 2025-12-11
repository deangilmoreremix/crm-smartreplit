import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  Activity,
  BarChart3,
  Search,
  FileText,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useTaskStore } from '../store/taskStore';
import { TaskKanbanBoard } from '../components/TaskKanbanBoard';
import { TaskCalendar } from '../components/TaskCalendar';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskDetailsModal } from '../components/TaskDetailsModal';

export const Tasks: React.FC = () => {
  const { tasks, getFilteredTasks } = useTaskStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Handle URL parameters for dropdown navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');

    // Handle tab switching from dropdown
    if (tab && ['board', 'calendar', 'analytics', 'activity'].includes(tab)) {
      setActiveTab(tab);
    }

    // Handle actions from dropdown
    if (action) {
      switch (action) {
        case 'new':
          setShowTaskModal(true);
          break;
        case 'search':
          setShowSearchModal(true);
          break;
        case 'templates':
          setShowTemplatesModal(true);
          break;
      }
      // Clean up URL parameters after handling
      navigate('/tasks', { replace: true });
    }
  }, [location.search, navigate]);

  // Calculate metrics from tasks array
  const allTasks = tasks || [];
  const completedTasks = allTasks.filter(task => task.status === 'completed');
  const pendingTasks = allTasks.filter(task => task.status === 'pending' || task.status === 'in-progress');
  const overdueTasks = allTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date() && task.status !== 'completed';
  });
  
  const tasksDueToday = allTasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const tasksDueThisWeek = allTasks.filter(task => {
    if (!task.dueDate) return false;
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= weekFromNow;
  });

  const metrics = {
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    overdueTasks: overdueTasks.length,
    completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
    productivityScore: allTasks.length > 0 ? ((completedTasks.length / allTasks.length) * 100) : 0,
    tasksCompletedThisWeek: completedTasks.filter(task => {
      if (!task.updatedAt) return false;
      const updated = new Date(task.updatedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return updated >= weekAgo;
    }).length,
    tasksByPriority: {
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length,
    },
    tasksByStatus: {
      pending: allTasks.filter(t => t.status === 'pending').length,
      'in-progress': allTasks.filter(t => t.status === 'in-progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      cancelled: allTasks.filter(t => t.status === 'cancelled').length,
      overdue: overdueTasks.length,
    },
    tasksByType: allTasks.reduce((acc: Record<string, number>, task) => {
      const category = task.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
              <p className="text-gray-600">Organize, track, and manage your tasks efficiently</p>
            </div>
            <Button onClick={() => setShowTaskModal(true)}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.pendingTasks}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.overdueTasks}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{tasksDueToday.length}</div>
                <div className="text-sm text-gray-600">Due Today</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{tasksDueThisWeek.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(overdueTasks.length > 0 || tasksDueToday.length > 0) && (
            <div className="space-y-2 mb-6">
              {overdueTasks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Badge className="bg-red-100 text-red-800 mr-3">
                      {overdueTasks.length} Overdue
                    </Badge>
                    <span className="text-sm text-red-700">
                      You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} that need attention
                    </span>
                  </div>
                </div>
              )}

              {tasksDueToday.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Badge className="bg-orange-100 text-orange-800 mr-3">
                      {tasksDueToday.length} Due Today
                    </Badge>
                    <span className="text-sm text-orange-700">
                      {tasksDueToday.length} task{tasksDueToday.length > 1 ? 's' : ''} due today
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none w-full justify-start h-auto p-0">
            <TabsTrigger 
              value="board" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent px-6 py-3"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="board" className="h-full m-0">
            <TaskKanbanBoard />
          </TabsContent>

          <TabsContent value="calendar" className="h-full m-0">
            <TaskCalendar />
          </TabsContent>

          <TabsContent value="activity" className="h-full m-0">
            <ActivityFeed />
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Completion Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {metrics.completionRate.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.completionRate}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Productivity Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Productivity Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {metrics.productivityScore.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Based on completion rate and daily goals
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks by Priority */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(metrics.tasksByPriority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{priority}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(metrics.tasksByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{type.replace('-', ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasks by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(metrics.tasksByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{status.replace('-', ' ')}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-semibold">{metrics.tasksCompletedThisWeek}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Due this week</span>
                        <span className="font-semibold">{tasksDueThisWeek.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completion rate</span>
                        <span className="font-semibold">
                          {tasksDueThisWeek.length > 0 
                            ? `${((metrics.tasksCompletedThisWeek / tasksDueThisWeek.length) * 100).toFixed(0)}%`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskDetailsModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Search Tasks</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="text-sm text-gray-500">
                Search through your tasks by title, description, or category.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Task Templates</h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {['Follow-up Call', 'Meeting Prep', 'Project Review', 'Client Proposal'].map((template) => (
                <button
                  key={template}
                  className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowTemplatesModal(false);
                    setShowTaskModal(true);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{template}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

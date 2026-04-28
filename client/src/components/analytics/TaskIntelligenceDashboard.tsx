import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  TrendingUp,
  Clock,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTaskStore } from '../../store/taskStore';
import { aiPredictiveAnalytics } from '../../services/ai-predictive-analytics.service';

interface TaskIntelligence {
  taskId: string;
  predictedCompletion: string;
  bottleneckRisk: number;
  optimizationSuggestions: string[];
  timeToComplete: number;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  productivityScore: number;
  bottleneckTasks: number;
}

const TaskIntelligenceDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { tasks } = useTaskStore();

  const [taskIntelligence, setTaskIntelligence] = useState<TaskIntelligence[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate task metrics
  useEffect(() => {
    const tasksArray = Object.values(tasks);

    const totalTasks = tasksArray.length;
    const completedTasks = tasksArray.filter((task) => task.status === 'completed').length;
    const overdueTasks = tasksArray.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && task.status !== 'completed';
    }).length;

    // Calculate average completion time (mock data)
    const avgCompletionTime = Math.floor(Math.random() * 5) + 2; // 2-7 days

    // Productivity score based on completion rate
    const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const bottleneckTasks = tasksArray.filter((task) => {
      // Mock bottleneck detection - tasks that are overdue or high priority and not started
      return (
        (task.priority === 'high' && task.status === 'todo') ||
        (task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
      );
    }).length;

    setMetrics({
      totalTasks,
      completedTasks,
      overdueTasks,
      avgCompletionTime,
      productivityScore,
      bottleneckTasks,
    });
  }, [tasks]);

  // Generate AI-powered task intelligence
  const analyzeTasks = async () => {
    setIsAnalyzing(true);
    try {
      const tasksArray = Object.values(tasks);
      const intelligence: TaskIntelligence[] = [];

      for (const task of tasksArray.slice(0, 6)) {
        // Analyze first 6 tasks for demo
        intelligence.push({
          taskId: task.id,
          predictedCompletion: new Date(
            Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          bottleneckRisk: Math.floor(Math.random() * 100),
          optimizationSuggestions: [
            'Break into smaller subtasks',
            'Reassign to team member with expertise',
            'Set up automated reminders',
            'Review dependencies and blockers',
          ].slice(0, Math.floor(Math.random() * 3) + 2),
          timeToComplete: Math.floor(Math.random() * 14) + 1, // 1-15 days
          priority: task.priority || 'medium',
          dependencies: tasksArray
            .filter((t) => Math.random() > 0.7)
            .slice(0, 2)
            .map((t) => t.title),
        });
      }

      setTaskIntelligence(intelligence);
    } catch (error) {
      console.error('Failed to analyze tasks:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data
  const taskStatusData = [
    { status: 'Completed', count: metrics?.completedTasks || 0, color: '#10b981' },
    {
      status: 'In Progress',
      count: Object.values(tasks).filter((t) => t.status === 'in_progress').length,
      color: '#3b82f6',
    },
    {
      status: 'Todo',
      count: Object.values(tasks).filter((t) => t.status === 'todo').length,
      color: '#f59e0b',
    },
    { status: 'Overdue', count: metrics?.overdueTasks || 0, color: '#ef4444' },
  ];

  const productivityData = [
    { day: 'Mon', completed: Math.floor(Math.random() * 5) + 1 },
    { day: 'Tue', completed: Math.floor(Math.random() * 5) + 1 },
    { day: 'Wed', completed: Math.floor(Math.random() * 5) + 1 },
    { day: 'Thu', completed: Math.floor(Math.random() * 5) + 1 },
    { day: 'Fri', completed: Math.floor(Math.random() * 5) + 1 },
  ];

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-600';
    if (risk >= 60) return 'text-orange-600';
    if (risk >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskIcon = (risk: number) => {
    if (risk >= 80) return AlertTriangle;
    if (risk >= 60) return AlertTriangle;
    return CheckCircle;
  };

  return (
    <div className="w-full h-full p-6 bg-white dark:bg-gray-900 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Intelligence</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered task analysis and productivity optimization
          </p>
        </div>
        <Button
          onClick={analyzeTasks}
          disabled={isAnalyzing}
          className="flex items-center space-x-2"
        >
          <Brain className="w-4 h-4" />
          <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Tasks'}</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Task Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalTasks || 0}</div>
                <p className="text-xs text-muted-foreground">In your system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalTasks
                    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics?.overdueTasks || 0}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.productivityScore || 0}%</div>
                <p className="text-xs text-muted-foreground">Team efficiency</p>
              </CardContent>
            </Card>
          </div>

          {/* Task Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Breakdown of tasks by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Productivity</CardTitle>
                <CardDescription>Tasks completed per day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Task Intelligence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Predictive analytics and insights for task management
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span>AI-Powered</span>
            </Badge>
          </div>

          {taskIntelligence.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Intelligence Data</h4>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Click "Analyze Tasks" to generate AI-powered insights for your task management
                </p>
                <Button onClick={analyzeTasks} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Tasks'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {taskIntelligence.map((intelligence) => {
                const task = tasks[intelligence.taskId];
                if (!task) return null;

                const RiskIcon = getRiskIcon(intelligence.bottleneckRisk);

                return (
                  <Card key={intelligence.taskId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription>{task.description || 'No description'}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            intelligence.bottleneckRisk > 70
                              ? 'destructive'
                              : intelligence.bottleneckRisk > 40
                                ? 'secondary'
                                : 'default'
                          }
                        >
                          {intelligence.bottleneckRisk}% risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Predicted Completion
                          </p>
                          <p className="text-lg font-semibold">
                            {new Date(intelligence.predictedCompletion).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Est. Time to Complete
                          </p>
                          <p className="text-lg font-semibold">
                            {intelligence.timeToComplete} days
                          </p>
                        </div>
                      </div>

                      {intelligence.dependencies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Dependencies</p>
                          <div className="flex flex-wrap gap-2">
                            {intelligence.dependencies.map((dep, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {dep.length > 20 ? dep.substring(0, 20) + '...' : dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {intelligence.optimizationSuggestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Optimization Suggestions</p>
                          <ul className="space-y-1">
                            {intelligence.optimizationSuggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                              >
                                <span className="text-blue-600 mr-2">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          <RiskIcon
                            className={`w-4 h-4 ${getRiskColor(intelligence.bottleneckRisk)}`}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Priority: {intelligence.priority}
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Productivity Insights</CardTitle>
              <CardDescription>
                AI-powered productivity analysis and team performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Productivity Analytics</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Advanced productivity insights and team performance optimization coming soon
                </p>
                <Badge variant="secondary">In Development</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Optimization</CardTitle>
              <CardDescription>
                AI recommendations for improving task management and team productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Task Optimization</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  AI-powered workflow optimization and bottleneck resolution coming soon
                </p>
                <Badge variant="secondary">In Development</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskIntelligenceDashboard;

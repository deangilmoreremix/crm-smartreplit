import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Task, 
  SubTask, 
  TaskAttachment, 
  TaskReminder, 
  TaskTemplate, 
  Activity, 
  TaskMetrics, 
  CalendarEvent, 
  TaskFilter
} from '../types/task';

type TaskPriority = Task['priority'];
type TaskStatus = Task['status'];
type ActivityFilter = TaskFilter;

interface TaskStore {
  // State
  tasks: Task[];
  templates: TaskTemplate[];
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  analytics: TaskMetrics;

  // Filter states
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  assigneeFilter: string | 'all';
  dueDateFilter: 'all' | 'overdue' | 'today' | 'week' | 'month';
  searchQuery: string;
  activityFilter: ActivityFilter;

  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;

  // Computed properties
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      templates: [],
      activities: [],
      calendarEvents: [],
      analytics: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        tasksCreatedToday: 0,
        tasksCompletedToday: 0,
        averageCompletionTime: 0,
        productivityScore: 0,
        upcomingDeadlines: 0,
        tasksByPriority: { low: 0, medium: 0, high: 0 },
        tasksByStatus: { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0, overdue: 0 },
        completionRate: 0,
        trendsData: []
      },

      // Filter initial states
      statusFilter: 'all',
      priorityFilter: 'all',
      assigneeFilter: 'all',
      dueDateFilter: 'all',
      searchQuery: '',
      activityFilter: {
        types: [],
        dateRange: null,
        users: []
      },

      // Task actions
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          attachments: taskData.attachments || [],
          subtasks: taskData.subtasks || [],
          reminders: taskData.reminders || [],
          tags: taskData.tags || [],
          dependencies: taskData.dependencies || [],
          customFields: taskData.customFields || {},
          createdBy: taskData.createdBy || 'current-user'
        };

        set((state) => ({ 
          tasks: [...state.tasks, newTask] 
        }));
        // Emit event for universal sync
        window.dispatchEvent(new CustomEvent('tasksChanged', { 
          detail: { tasks: get().tasks } 
        }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          )
        }));
        // Emit event for universal sync
        window.dispatchEvent(new CustomEvent('tasksChanged', { 
          detail: { tasks: get().tasks } 
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id)
        }));
        // Emit event for universal sync
        window.dispatchEvent(new CustomEvent('tasksChanged', { 
          detail: { tasks: get().tasks } 
        }));
      },

      getTask: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      // Computed properties
      getFilteredTasks: () => {
        const state = get();
        let filtered = state.tasks;

        // Status filter
        if (state.statusFilter !== 'all') {
          filtered = filtered.filter((task) => task.status === state.statusFilter);
        }

        // Priority filter
        if (state.priorityFilter !== 'all') {
          filtered = filtered.filter((task) => task.priority === state.priorityFilter);
        }

        // Search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((task) =>
            task.title.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query) ||
            task.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status);
      },

      getTaskMetrics: () => {
        const state = get();
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const completedTasks = state.tasks.filter(task => task.status === 'completed').length;
        const overdueTasks = state.tasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
        ).length;
        const tasksCompletedToday = state.tasks.filter(task =>
          task.status === 'completed' && 
          task.completedDate && 
          new Date(task.completedDate) >= startOfDay && 
          new Date(task.completedDate) < endOfDay
        ).length;
        const tasksCompletedThisWeek = state.tasks.filter(task =>
          task.status === 'completed' && 
          task.completedDate && 
          new Date(task.completedDate) >= startOfWeek && 
          new Date(task.completedDate) < endOfWeek
        ).length;
        const tasksCompletedThisMonth = state.tasks.filter(task =>
          task.status === 'completed' && 
          task.completedDate && 
          new Date(task.completedDate) >= startOfMonth && 
          new Date(task.completedDate) <= endOfMonth
        ).length;

        // Calculate average completion time
        const completedTasksWithDates = state.tasks.filter(task => 
          task.status === 'completed' && task.createdAt && task.completedDate
        );
        const averageCompletionTime = completedTasksWithDates.length > 0 
          ? completedTasksWithDates.reduce((sum, task) => {
              const created = new Date(task.createdAt).getTime();
              const completed = new Date(task.completedDate!).getTime();
              return sum + (completed - created) / (1000 * 60 * 60 * 24); // days
            }, 0) / completedTasksWithDates.length
          : 0;

        const completionRate = state.tasks.length > 0 ? (completedTasks / state.tasks.length) * 100 : 0;

        // Count tasks by type
        const tasksByType = state.tasks.reduce((acc, task) => {
          acc[task.type] = (acc[task.type] || 0) + 1;
          return acc;
        }, {} as Record<Task['type'], number>);

        // Count tasks by priority
        const tasksByPriority = state.tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {} as Record<Task['priority'], number>);

        // Count tasks by status
        const tasksByStatus = state.tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<Task['status'], number>);

        return {
          totalTasks: state.tasks.length,
          completedTasks,
          pendingTasks: state.tasks.filter(task => task.status === 'pending').length,
          overdueTasks,
          tasksCompletedToday,
          tasksCompletedThisWeek,
          tasksCompletedThisMonth,
          averageCompletionTime,
          completionRate,
          tasksByType,
          tasksByPriority,
          tasksByStatus,
          tasksByUser: {},
          productivityScore: Math.min(100, completionRate + (tasksCompletedToday * 5))
        };
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < now && 
          task.status !== 'completed'
        );
      },

      getTasksDueToday: () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        return get().tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) >= startOfDay && 
          new Date(task.dueDate) < endOfDay &&
          task.status !== 'completed'
        );
      },

      getTasksDueThisWeek: () => {
        const now = new Date();
        const startOfWeek = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

        return get().tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) >= startOfWeek && 
          new Date(task.dueDate) < endOfWeek &&
          task.status !== 'completed'
        );
      }
    }),
    {
      name: 'task-store',
      partialize: (state) => ({
        tasks: state.tasks,
        templates: state.templates,
        activities: state.activities,
        calendarEvents: state.calendarEvents
      })
    }
  )
);
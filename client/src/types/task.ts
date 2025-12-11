export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'proposal' | 'demo' | 'contract' | 'research' | 'administrative' | 'other';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedUserId?: string;
  assignedUserName?: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  dueDate?: Date;
  completedDate?: Date;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  tags: string[];
  attachments: TaskAttachment[];
  subtasks: SubTask[];
  dependencies: string[]; // task IDs that must be completed first
  reminders: TaskReminder[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  completedBy?: string;
  notes?: string;
  location?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  parentTaskId?: string; // for subtasks
  // Legacy compatibility
  completed: boolean;
  category: 'follow-up' | 'proposal' | 'meeting' | 'call' | 'email' | 'research' | 'administrative' | 'other';
  assigneeId?: string;
  relatedTo?: {
    type: 'contact' | 'deal';
    id: string;
  };
  completedAt?: Date;
}

export interface SubTask {
  id: string;
  parentTaskId: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  assignedUserId?: string;
  dueDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  reminderTime: Date;
  type: 'email' | 'push' | 'sms';
  message?: string;
  sent: boolean;
  sentAt?: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // every X days/weeks/months/years
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  endDate?: Date;
  maxOccurrences?: number;
}

export interface Activity {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_updated' | 'call_made' | 'email_sent' | 'meeting_held' | 'note_added' | 'deal_moved' | 'contact_updated' | 'file_uploaded' | 'reminder_sent';
  title: string;
  description?: string;
  entityType: 'task' | 'deal' | 'contact' | 'company' | 'lead';
  entityId: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  isImportant?: boolean;
  isPrivate?: boolean;
}

export interface TaskFilter {
  statuses?: Task['status'][];
  types?: Task['type'][];
  priorities?: Task['priority'][];
  assignedUsers?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
  isDueTomorrow?: boolean;
  isDueThisWeek?: boolean;
  hasAttachments?: boolean;
  hasSubtasks?: boolean;
  contactId?: string;
  dealId?: string;
  companyId?: string;
}

export interface TaskSortOption {
  field: keyof Task;
  direction: 'asc' | 'desc';
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  averageCompletionTime: number; // days
  completionRate: number; // percentage
  tasksByType: Record<Task['type'], number>;
  tasksByPriority: Record<Task['priority'], number>;
  tasksByStatus: Record<Task['status'], number>;
  tasksByUser: Record<string, number>;
  productivityScore: number; // 0-100
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  type: Task['type'];
  priority: Task['priority'];
  estimatedDuration?: number;
  subtasks: Omit<SubTask, 'id' | 'parentTaskId' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  useCount: number;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isVisible: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
  attendees: string[]; // user IDs
  taskId?: string;
  dealId?: string;
  contactId?: string;
  reminderMinutes?: number[];
  recurrence?: RecurringPattern;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  upcoming: number;
}

export interface TaskFilters {
  status: 'all' | 'completed' | 'pending' | 'overdue';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  category: 'all' | 'follow-up' | 'proposal' | 'meeting' | 'call' | 'email' | 'research' | 'administrative' | 'other';
  assignee: string;
}

export type TaskSort = 'dueDate' | 'priority' | 'title' | 'createdAt';

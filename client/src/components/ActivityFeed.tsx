import React, { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek, subDays } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Plus,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Filter,
  Search,
  AlertCircle,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { Activity } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const activityIcons: Record<Activity['type'], React.ElementType> = {
  task_created: Plus,
  task_updated: Edit,
  task_completed: CheckCircle2,
  task_deleted: Trash2,
  task_assigned: User,
  task_due_date_changed: Calendar,
  subtask_created: Plus,
  subtask_completed: CheckCircle2,
  comment_added: MessageSquare,
  file_attached: FileText,
  call_logged: Phone,
  email_sent: Mail,
  meeting_scheduled: Calendar,
  reminder_set: AlertCircle,
  // fallback icons for any missing types
  call_made: Phone,
  meeting_held: Calendar,
  note_added: MessageSquare,
  deal_moved: Edit,
  contact_updated: User,
  file_uploaded: FileText,
  reminder_sent: AlertCircle,
};

const activityColors: Partial<Record<Activity['type'], string>> = {
  task_created: 'text-green-600 bg-green-100',
  task_updated: 'text-blue-600 bg-blue-100',
  task_completed: 'text-green-600 bg-green-100',
  task_deleted: 'text-red-600 bg-red-100',
  task_assigned: 'text-purple-600 bg-purple-100',
  task_due_date_changed: 'text-orange-600 bg-orange-100',
  subtask_created: 'text-green-600 bg-green-100',
  subtask_completed: 'text-green-600 bg-green-100',
  comment_added: 'text-blue-600 bg-blue-100',
  file_attached: 'text-gray-600 bg-gray-100',
  call_logged: 'text-green-600 bg-green-100',
  email_sent: 'text-blue-600 bg-blue-100',
  meeting_scheduled: 'text-purple-600 bg-purple-100',
  reminder_set: 'text-orange-600 bg-orange-100',
  // fallback colors for any missing types
  call_made: 'text-green-600 bg-green-100',
  meeting_held: 'text-purple-600 bg-purple-100',
  note_added: 'text-blue-600 bg-blue-100',
  deal_moved: 'text-orange-600 bg-orange-100',
  contact_updated: 'text-purple-600 bg-purple-100',
  file_uploaded: 'text-gray-600 bg-gray-100',
  reminder_sent: 'text-orange-600 bg-orange-100',
};

interface ActivityItemProps {
  activity: Activity;
  showDate?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, showDate = true }) => {
  const Icon = activityIcons[activity.type] || Circle;
  const colorClass = activityColors[activity.type] || 'text-gray-600 bg-gray-100';

  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE [at] h:mm a');
    } else {
      return format(date, 'MMM d [at] h:mm a');
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {activity.title}
        </p>
        
        {activity.description && (
          <p className="text-sm text-gray-600 mb-2">
            {activity.description}
          </p>
        )}
        
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>{activity.userName}</span>
          {showDate && (
            <>
              <span>•</span>
              <span>{formatTime(activity.createdAt)}</span>
            </>
          )}
          {activity.entityType && activity.entityId && (
            <>
              <span>•</span>
              <span className="capitalize">{activity.entityType}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ActivityGroupProps {
  date: Date;
  activities: Activity[];
}

const ActivityGroup: React.FC<ActivityGroupProps> = ({ date, activities }) => {
  const formatGroupDate = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="space-y-1">
      <div className="sticky top-0 bg-white border-b border-gray-200 py-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {formatGroupDate(date)}
        </h3>
      </div>
      
      <div className="space-y-1">
        {activities.map((activity) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            showDate={false}
          />
        ))}
      </div>
    </div>
  );
};

interface ActivityFilters {
  search?: string;
  types?: Activity['type'][];
  entityTypes?: Activity['entityType'][];
  userIds?: string[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

export const ActivityFeed: React.FC = () => {
  const { activities } = useTaskStore();
  
  const [filters, setFilters] = useState<ActivityFilters>({
    dateRange: 'week'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByDate, setGroupByDate] = useState(true);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(term) ||
        activity.description?.toLowerCase().includes(term) ||
        activity.userName.toLowerCase().includes(term)
      );
    }

    // Apply type filters
    if (filters.types?.length) {
      filtered = filtered.filter(activity =>
        filters.types!.includes(activity.type)
      );
    }

    // Apply entity type filters
    if (filters.entityTypes?.length) {
      filtered = filtered.filter(activity =>
        filters.entityTypes!.includes(activity.entityType)
      );
    }

    // Apply user filters
    if (filters.userIds?.length) {
      filtered = filtered.filter(activity =>
        filters.userIds!.includes(activity.userId)
      );
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = subDays(now, 7);
          break;
        case 'month':
          cutoffDate = subDays(now, 30);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(activity =>
        activity.createdAt >= cutoffDate
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }, [activities, searchTerm, filters]);

  // Group activities by date if enabled
  const groupedActivities = useMemo(() => {
    if (!groupByDate) {
      return { ungrouped: filteredActivities };
    }

    const groups: Record<string, Activity[]> = {};
    
    filteredActivities.forEach(activity => {
      const dateKey = format(activity.createdAt, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  }, [filteredActivities, groupByDate]);

  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({ dateRange: 'week' });
    setSearchTerm('');
  };

  const getFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value && (Array.isArray(value) ? value.length > 0 : key !== 'dateRange' || value !== 'week')
    ).length + (searchTerm ? 1 : 0);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
            <p className="text-gray-600">Track all task and project activities</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={groupByDate ? 'grouped' : 'list'}
              onValueChange={(value) => setGroupByDate(value === 'grouped')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grouped">Grouped</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range */}
          <Select
            value={filters.dateRange}
            onValueChange={(value) => updateFilters({ dateRange: value as ActivityFilters['dateRange'] })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getFilterCount() > 0 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    {getFilterCount()}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="font-medium">
                Activity Type
              </DropdownMenuItem>
              {Object.keys(activityIcons).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={filters.types?.includes(type as Activity['type'])}
                  onCheckedChange={(checked) => {
                    const types = filters.types || [];
                    updateFilters({
                      types: checked
                        ? [...types, type as Activity['type']]
                        : types.filter(t => t !== type)
                    });
                  }}
                >
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="font-medium">
                Entity Type
              </DropdownMenuItem>
              {(['task', 'deal', 'contact', 'calendar'] as const).map((entityType) => (
                <DropdownMenuCheckboxItem
                  key={entityType}
                  checked={filters.entityTypes?.includes(entityType)}
                  onCheckedChange={(checked) => {
                    const entityTypes = filters.entityTypes || [];
                    updateFilters({
                      entityTypes: checked
                        ? [...entityTypes, entityType]
                        : entityTypes.filter(t => t !== entityType)
                    });
                  }}
                >
                  <span className="capitalize">{entityType}</span>
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={clearFilters}>
                Clear All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-auto">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No activities found</h3>
            <p className="text-sm text-center max-w-sm">
              {searchTerm || Object.keys(filters).length > 1
                ? 'Try adjusting your search or filters'
                : 'Activities will appear here as tasks are created and updated'
              }
            </p>
          </div>
        ) : groupByDate ? (
          <div className="space-y-6">
            {Object.entries(groupedActivities)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, dayActivities]) => (
                <ActivityGroup
                  key={dateKey}
                  date={new Date(dateKey)}
                  activities={dayActivities}
                />
              ))
            }
          </div>
        ) : (
          <div className="space-y-1">
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredActivities.length} of {activities.length} activities
          </span>
          
          <div className="flex items-center space-x-4">
            <span>
              {filteredActivities.filter(a => isToday(a.createdAt)).length} today
            </span>
            <span>
              {filteredActivities.filter(a => isThisWeek(a.createdAt)).length} this week
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

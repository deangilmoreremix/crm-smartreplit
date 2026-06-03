import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface TimelineActivity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  workspace_member_id: string;
  workspace_member?: {
    full_name: string;
    avatar_url?: string;
  };
  properties: Record<string, any>;
  name: string;
  linked_record_cached_name: string;
  linked_record_id: string | null;
  linked_object_metadata_id: string | null;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'sms' | 'meeting_transcript';
}

interface EventGroup {
  year: number;
  month: number;
  items: TimelineActivity[];
}

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'email':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'call':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    case 'meeting':
    case 'meeting_transcript':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'note':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case 'task':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'sms':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
};

const groupEventsByMonth = (events: TimelineActivity[]): EventGroup[] => {
  const groups: Map<string, TimelineActivity[]> = new Map();

  events.forEach(event => {
    const date = new Date(event.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, items };
    });
};

interface ContactActivityTimelineProps {
  contactId: string;
  className?: string;
}

export const ContactActivityTimeline: React.FC<ContactActivityTimelineProps> = ({
  contactId,
  className = ''
}) => {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (limit: number = 20, offset: number = 0) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('contact_activities')
        .select(`
          *,
          workspace_member:workspace_members(full_name, avatar_url)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching activities:', err);
      return [];
    }
  }, [contactId]);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const data = await fetchActivities(20, 0);
      setActivities(data);
      setHasMore(data.length === 20);
      setLoading(false);
    };
    loadInitial();
  }, [fetchActivities]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const moreData = await fetchActivities(20, activities.length);
    setActivities(prev => [...prev, ...moreData]);
    setHasMore(moreData.length === 20);
    setLoadingMore(false);
  };

  const groupedEvents = groupEventsByMonth(activities);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
        <p className="text-gray-500">There is no activity associated with this contact.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {groupedEvents.map((group, groupIndex) => {
        const monthName = new Date(group.year, group.month).toLocaleString('default', { month: 'long' });
        const showYear = groupIndex === 0 || group.year !== groupedEvents[groupIndex - 1].year;

        return (
          <div key={`${group.year}-${group.month}`}>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {monthName} {showYear ? group.year : ''}
              </h3>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200"></div>

              <div className="space-y-4">
                {group.items.map((activity, index) => {
                  const isLast = index === group.items.length - 1 && groupIndex === groupedEvents.length - 1;

                  return (
                    <div key={activity.id} className="relative pl-10">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                        activity.activity_type === 'meeting_transcript' 
                          ? 'bg-purple-100 text-purple-600' 
                          : activity.activity_type === 'call'
                          ? 'bg-green-100 text-green-600'
                          : activity.activity_type === 'email'
                          ? 'bg-blue-100 text-blue-600'
                          : activity.activity_type === 'sms'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>

                      {!isLast && (
                        <div className="absolute left-3 top-8 bottom-0 w-px bg-gray-200"></div>
                      )}

                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.workspace_member?.full_name || 'System'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {activity.name}
                            </p>
                            {activity.properties?.body && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                {activity.properties.body}
                              </p>
                            )}
                            {activity.properties?.summary && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <span className="font-medium text-gray-600">AI Summary:</span>
                                <p className="text-gray-700 mt-1">{activity.properties.summary}</p>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatRelativeTime(activity.created_at)}
                          </span>
                        </div>

                        {activity.linked_record_id && activity.linked_object_metadata_id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              Linked to: {activity.linked_record_cached_name || 'Record'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactActivityTimeline;
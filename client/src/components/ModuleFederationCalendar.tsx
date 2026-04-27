import React, { lazy, Suspense } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ENABLE_MFE = import.meta.env.VITE_ENABLE_MFE === 'true';

// Lazy load the remote CalendarApp
const RemoteCalendarApp = lazy(() => import('CalendarApp/CalendarApp'));

// Local fallback component when Module Federation is not available
const LocalCalendarFallback: React.FC = () => {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const events = [
    { id: 1, title: 'Team Meeting', date: '2026-04-27', time: '10:00 AM' },
    { id: 2, title: 'Client Call', date: '2026-04-27', time: '2:00 PM' },
    { id: 3, title: 'Project Review', date: '2026-04-28', time: '11:00 AM' },
  ];

  const todayEvents = events.filter(
    (event) => event.date === currentDate.toISOString().split('T')[0]
  );

  return (
    <div className={`w-full h-full p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule and manage your events (Local Fallback)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                      )
                    }
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                      )
                    }
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Simple calendar grid placeholder */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => (
                  <div
                    key={i}
                    className={`p-2 text-center text-sm ${
                      i + 1 === currentDate.getDate()
                        ? 'bg-blue-600 text-white rounded'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                    }`}
                  >
                    {i + 1 <= 31 ? i + 1 : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="space-y-6">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Events
              </h3>
              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No events scheduled for today</p>
              )}
            </div>

            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is a local fallback implementation. The full calendar module is being loaded
            remotely.
          </p>
        </div>
      </div>
    </div>
  );
};

const CalendarApp: React.FC = () => {
  if (!ENABLE_MFE) {
    return <LocalCalendarFallback />;
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Calendar Module...</p>
          </div>
        </div>
      }
    >
      <RemoteCalendarApp theme="light" mode="light" />
    </Suspense>
  );
};

interface ModuleFederationCalendarProps {
  showHeader?: boolean;
}

const ModuleFederationCalendar: React.FC<ModuleFederationCalendarProps> = ({
  showHeader = false,
}) => {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ margin: 0, padding: 0 }}
      data-testid="calendar-month"
    >
      {showHeader && (
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI Calendar</h3>
            <div className="flex items-center text-green-600 text-xs">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Loaded
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 w-full h-full" style={{ margin: 0, padding: 0 }}>
        <CalendarApp />
      </div>
    </div>
  );
};

export default ModuleFederationCalendar;

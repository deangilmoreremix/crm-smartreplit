import React from 'react';
import { useAppointmentStore } from '../store/appointmentStore';
import type { Appointment, AppointmentType } from '../store/appointmentStore';
import { Calendar, Clock, Video, Phone, MapPin, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import SampleBadge from './SampleBadge';

interface AppointmentWidgetProps {
  limit?: number;
}

/** Scheduled appointments that start after `now`, soonest first. */
export function selectUpcomingAppointments(
  appointments: Record<string, Appointment>,
  limit: number,
  now: number = Date.now()
): Appointment[] {
  return Object.values(appointments)
    .filter((apt) => apt.status === 'scheduled' && new Date(apt.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

const TYPE_ICON: Record<AppointmentType, typeof Video> = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
};

const TYPE_COLOR: Record<AppointmentType, string> = {
  video: 'text-green-500 bg-green-500/20',
  phone: 'text-blue-500 bg-blue-500/20',
  'in-person': 'text-purple-500 bg-purple-500/20',
};

const AppointmentWidget: React.FC<AppointmentWidgetProps> = ({ limit = 5 }) => {
  const { appointments } = useAppointmentStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const upcomingAppointments = selectUpcomingAppointments(appointments, limit);

  const formatDateTime = (value: Date) => {
    const date = new Date(value);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let dateStr = '';
    if (date.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    const timeStr = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
  };

  const strong = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <section className="p-6 relative" aria-label="Upcoming appointments">
      {/* Add Appointment Button */}
      <button
        onClick={() => navigate('/appointments')}
        className={`absolute top-4 right-4 p-1 rounded-full ${
          isDark
            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
            : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
        }`}
        title="New appointment"
        aria-label="New appointment"
      >
        <Plus size={16} />
      </button>

      {upcomingAppointments.length > 0 && (
        <div className="flex items-center justify-between mb-4 pr-8">
          <span className={`text-sm ${muted}`}>{upcomingAppointments.length} scheduled</span>
        </div>
      )}

      {upcomingAppointments.length > 0 ? (
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => {
            const TypeIcon = TYPE_ICON[appointment.type] ?? Calendar;
            const color = TYPE_COLOR[appointment.type] ?? 'text-gray-500 bg-gray-500/20';

            return (
              <div
                key={appointment.id}
                role="button"
                tabIndex={0}
                className={`border rounded-lg p-4 transition-colors group cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => navigate('/appointments')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/appointments');
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <TypeIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium text-sm truncate group-hover:text-green-500 transition-colors ${strong}`}
                    >
                      {appointment.title}
                      {appointment.isDemo && <SampleBadge className="ml-2 align-middle" />}
                    </h3>
                    {(appointment.notes || appointment.contactName) && (
                      <p className={`text-xs mt-1 truncate ${muted}`}>
                        {appointment.contactName || appointment.notes}
                      </p>
                    )}
                    <div className={`flex items-center mt-2 text-xs ${muted}`}>
                      <Clock size={12} className="mr-1" />
                      {formatDateTime(appointment.date)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {appointment.type}
                    </span>
                    <MoreHorizontal
                      size={14}
                      className={`${muted} opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <Calendar
            size={32}
            className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
          />
          <p className={`mb-3 ${muted}`}>No upcoming appointments</p>
          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
          >
            Schedule Appointment
          </button>
        </div>
      )}
    </section>
  );
};

export default AppointmentWidget;

import React from 'react';
import { useAppointmentStore } from '../store/appointmentStore';
import { Calendar, Clock, Video, Phone, MoreHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface AppointmentWidgetProps {
  limit?: number;
}

const AppointmentWidget: React.FC<AppointmentWidgetProps> = ({ limit = 5 }) => {
  const { appointments } = useAppointmentStore();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const upcomingAppointments = Object.values(appointments)
    .filter(apt => apt.status === 'scheduled' && apt.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, limit);

  const formatDateTime = (date: Date) => {
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
      hour12: true 
    });

    return `${dateStr} at ${timeStr}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone;
      case 'demo': 
      case 'meeting': 
      case 'presentation': 
      default: return Video;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-400 bg-blue-500/20';
      case 'demo': return 'text-green-400 bg-green-500/20';
      case 'presentation': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="p-6 relative">
      {/* Add Appointment Button */}
      <button 
        onClick={() => navigate('/appointments/new')}
        className={`absolute top-4 right-4 p-1 rounded-full ${
          isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
        }`}
        title="New appointment"
      >
        <Plus size={16} />
      </button>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Calendar size={20} className="text-blue-400 mr-2" />
          Upcoming Appointments
        </h2>
        {upcomingAppointments.length > 0 && (
          <span className="text-sm text-gray-400">{upcomingAppointments.length} scheduled</span>
        )}
      </div>

      {upcomingAppointments.length > 0 ? (
        <div className="space-y-3">
          {upcomingAppointments.map((appointment) => {
            const TypeIcon = getTypeIcon(appointment.type);
            
            return (
              <div 
                key={appointment.id} 
                className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors group cursor-pointer" 
                onClick={() => navigate(`/appointments/${appointment.id}`)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(appointment.type)}`}>
                    <TypeIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-sm truncate group-hover:text-green-400 transition-colors">
                      {appointment.title}
                    </h3>
                    {appointment.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {appointment.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <Clock size={12} className="mr-1" />
                      {formatDateTime(appointment.startTime)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.type === 'demo' ? 'bg-green-500/20 text-green-400' :
                      appointment.type === 'call' ? 'bg-blue-500/20 text-blue-400' :
                      appointment.type === 'presentation' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {appointment.type}
                    </span>
                    <button className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <Calendar size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 mb-3">No upcoming appointments</p>
          <button 
            onClick={() => navigate('/appointments/new')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
          >
            Schedule Appointment
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentWidget;
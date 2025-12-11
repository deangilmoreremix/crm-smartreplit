import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import TasksSection from '../TasksSection';
import AppointmentWidget from '../AppointmentWidget';
import InteractionHistory from '../dashboard/InteractionHistory';
import TasksAndFunnel from '../dashboard/TasksAndFunnel';
import RecentActivity from '../dashboard/RecentActivity';

const ActivitiesCommunications: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="mb-10">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mr-3">
          <CheckSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Activities & Communications</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your tasks, appointments, and communications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tasks Section - takes 2 columns */}
        <div className="lg:col-span-2">
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 mb-6`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
              <CheckSquare className="h-5 w-5 mr-2 text-orange-500" />
              Tasks & Activities
            </h3>
            <TasksSection />
          </div>
          
          {/* Interaction History */}
          <div className="mb-6">
            <InteractionHistory />
          </div>
        </div>
        
        {/* Right Side - Appointments and Activity */}
        <div className="space-y-6 lg:col-span-1">
          {/* Appointments Widget */}
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Upcoming Appointments
              </h3>
            </div>
            <AppointmentWidget limit={5} />
          </div>
          
          {/* Quick Tasks Widget */}
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} backdrop-blur-xl border rounded-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                Communications
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        <MessageSquare size={14} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Follow-up</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Microsoft deal</p>
                      </div>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Today</span>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <Calendar size={14} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Meeting Notes</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ford collaboration</p>
                      </div>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tasks and Funnel Section */}
      <div className="mb-6">
        <TasksAndFunnel />
      </div>
      
      {/* Recent Activity */}
      <div className="mb-6">
        <RecentActivity />
      </div>
    </div>
  );
};

export default ActivitiesCommunications;
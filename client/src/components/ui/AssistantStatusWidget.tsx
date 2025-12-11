
import React, { useState, useEffect } from 'react';
import { Bot, Activity, MessageSquare, Clock } from 'lucide-react';
import { persistentAssistantService } from '../../services/persistentAssistantService';
import { Link } from 'react-router-dom';

const AssistantStatusWidget: React.FC = () => {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalActiveThreads: 0,
    totalInteractions: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    loadQuickStats();
    const interval = setInterval(loadQuickStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      await persistentAssistantService.initialize();
      const assistantsList = persistentAssistantService.getAssistantStats();
      setAssistants(assistantsList);

      const stats = {
        totalActiveThreads: assistantsList.reduce((sum, a) => sum + a.activeThreads.size, 0),
        totalInteractions: assistantsList.reduce((sum, a) => sum + a.totalInteractions, 0),
        avgResponseTime: assistantsList.reduce((sum, a) => sum + a.performance.averageResponseTime, 0) / Math.max(assistantsList.length, 1)
      };
      setSystemStats(stats);
    } catch (error) {
      console.error('Failed to load assistant stats:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Bot className="h-5 w-5 mr-2 text-indigo-600" />
          AI Assistants
        </h3>
        <Link 
          to="/assistants"
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{assistants.length}</div>
          <div className="text-xs text-gray-600">Active</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{systemStats.totalActiveThreads}</div>
          <div className="text-xs text-gray-600">Conversations</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{Math.round(systemStats.avgResponseTime)}ms</div>
          <div className="text-xs text-gray-600">Response</div>
        </div>
      </div>

      <div className="space-y-2">
        {assistants.slice(0, 3).map((assistant) => {
          const isActive = (Date.now() - assistant.lastUsed.getTime()) < 3600000; // Active if used in last hour
          return (
            <div key={assistant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">{assistant.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <MessageSquare className="h-3 w-3" />
                <span>{assistant.activeThreads.size}</span>
              </div>
            </div>
          );
        })}
      </div>

      {assistants.length === 0 && (
        <div className="text-center py-4">
          <Bot className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No assistants active</p>
        </div>
      )}
    </div>
  );
};

export default AssistantStatusWidget;

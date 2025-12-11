import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal, AlertTriangle } from 'lucide-react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useTheme } from '../contexts/ThemeContext';

interface ConnectionStats {
  bitrate: number;
  packetsLost: number;
  rtt: number; // Round trip time
  jitter: number;
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

const ConnectionQuality: React.FC = () => {
  const { peer, isInCall } = useVideoCall();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<ConnectionStats>({
    bitrate: 0,
    packetsLost: 0,
    rtt: 0,
    jitter: 0,
    quality: 'disconnected'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!peer || !isInCall) return;

    const statsInterval = setInterval(async () => {
      try {
        // Get WebRTC stats (this is a simplified version)
        // In a real implementation, you'd use peer._pc.getStats()
        
        // Simulate realistic connection stats for demo
        const simulatedStats: ConnectionStats = {
          bitrate: Math.floor(800 + Math.random() * 400), // 800-1200 kbps
          packetsLost: Math.floor(Math.random() * 5), // 0-5 packets
          rtt: Math.floor(50 + Math.random() * 100), // 50-150ms
          jitter: Math.floor(Math.random() * 20), // 0-20ms
          quality: 'good'
        };

        // Determine quality based on stats
        if (simulatedStats.rtt > 200 || simulatedStats.packetsLost > 10) {
          simulatedStats.quality = 'poor';
        } else if (simulatedStats.rtt > 100 || simulatedStats.packetsLost > 3) {
          simulatedStats.quality = 'good';
        } else {
          simulatedStats.quality = 'excellent';
        }

        setStats(simulatedStats);
      } catch (error) {
        console.error('Error getting connection stats:', error);
        setStats(prev => ({ ...prev, quality: 'disconnected' }));
      }
    }, 2000);

    return () => clearInterval(statsInterval);
  }, [peer, isInCall]);

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return <Wifi className="text-green-400" size={16} />;
      case 'good': return <Signal className="text-yellow-400" size={16} />;
      case 'poor': return <AlertTriangle className="text-orange-400" size={16} />;
      case 'disconnected': return <WifiOff className="text-red-400" size={16} />;
      default: return <WifiOff className="text-gray-400" size={16} />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800';
      case 'good': return isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'poor': return isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-800';
      case 'disconnected': return isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800';
      default: return isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800';
    }
  };

  if (!isInCall) return null;

  return (
    <div className="relative">
      {/* Quality Indicator Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
          isDark ? 'bg-black/50 hover:bg-black/70' : 'bg-white/50 hover:bg-white/70'
        } backdrop-blur-sm`}
      >
        {getQualityIcon(stats.quality)}
        <span className={`text-xs font-medium capitalize ${getQualityColor(stats.quality)}`}>
          {stats.quality}
        </span>
      </button>

      {/* Expanded Stats Panel */}
      {isExpanded && (
        <div className={`absolute top-10 left-0 w-72 ${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl border ${
          isDark ? 'border-white/20' : 'border-gray-200'
        } rounded-xl shadow-xl p-4 z-50`}>
          
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Connection Quality
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(stats.quality)}`}>
              {stats.quality}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Bitrate
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.bitrate} kbps
              </p>
            </div>

            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Latency
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.rtt} ms
              </p>
            </div>

            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Packet Loss
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.packetsLost}
              </p>
            </div>

            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                Jitter
              </p>
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.jitter} ms
              </p>
            </div>
          </div>

          {/* Quality Tips */}
          <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
            <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {stats.quality === 'excellent' && "🎉 Excellent connection! All systems optimal."}
              {stats.quality === 'good' && "👍 Good connection. Minor latency detected."}
              {stats.quality === 'poor' && "⚠️ Poor connection. Consider checking your internet."}
              {stats.quality === 'disconnected' && "❌ Connection issues. Trying to reconnect..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionQuality;
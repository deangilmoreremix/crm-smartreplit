import React, { useState } from 'react';
import { Video, Phone, Users, MessageSquare, X } from 'lucide-react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useContactStore } from '../hooks/useContactStore';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './ui/Avatar';
import { getInitials } from '../utils/avatars';

const PersistentVideoCallButton: React.FC = () => {
  const { initiateCall, callStatus } = useVideoCall();
  const { contacts } = useContactStore();
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Don't show if already in a call
  if (callStatus !== 'idle') return null;

  const contactList = Object.values(contacts).slice(0, 6); // Show first 6 contacts

  const handleStartCall = async (contactId: string, type: 'video' | 'audio') => {
    const contact = contacts[contactId];
    if (!contact) return;

    try {
      await initiateCall({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatarSrc || contact.avatar
      }, type);
      setIsExpanded(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Contact List */}
      {isExpanded && (
        <div className={`absolute bottom-20 right-0 w-80 ${
          isDark ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-xl border ${
          isDark ? 'border-white/20' : 'border-gray-200'
        } rounded-2xl shadow-2xl overflow-hidden mb-4 transform transition-all duration-300`}>
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Start a Call
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
            >
              <X size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            </button>
          </div>

          {/* Contact List */}
          <div className="max-h-96 overflow-y-auto">
            {contactList.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-gray-100'} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'} transition-colors last:border-b-0`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={contact.avatarSrc || contact.avatar}
                      alt={contact.name}
                      size="md"
                      fallback={getInitials(contact.name)}
                    />
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {contact.name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {contact.title || contact.position} at {contact.company}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartCall(contact.id, 'video')}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDark 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-green-100 hover:bg-green-200 text-green-600'
                      }`}
                      title="Start video call"
                    >
                      <Video size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleStartCall(contact.id, 'audio')}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isDark 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      }`}
                      title="Start audio call"
                    >
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'} bg-gradient-to-r ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'}`}>
            <div className="grid grid-cols-2 gap-3">
              <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${isDark ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} transition-colors`}>
                <Users size={16} />
                <span className="text-sm font-medium">Group Call</span>
              </button>
              <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg ${isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'} transition-colors`}>
                <MessageSquare size={16} />
                <span className="text-sm font-medium">Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Call Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform ${
          isExpanded ? 'scale-110 rotate-12' : 'hover:scale-105'
        } ${
          isDark 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        }`}
        title="Start a video call"
      >
        {isExpanded ? (
          <X size={24} className="text-white" />
        ) : (
          <Video size={24} className="text-white" />
        )}
      </button>

      {/* Status Indicator */}
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default PersistentVideoCallButton;
import React, { useState } from 'react';
import { Video, Phone, MessageSquare } from 'lucide-react';
import { useVideoCall } from '../contexts/VideoCallContext';
import { useTheme } from '../contexts/ThemeContext';
import type { CallParticipant } from '../contexts/VideoCallContext';
import { Contact } from '../types/contact';

interface CallButtonProps {
  contact: Contact;
  variant?: 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
}

const CallButton: React.FC<CallButtonProps> = ({ 
  contact, 
  variant = 'icon', 
  size = 'md' 
}) => {
  const { initiateCall, callStatus } = useVideoCall();
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoCall = async () => {
    if (callStatus !== 'idle') return;
    
    setIsLoading(true);
    try {
      const participant: CallParticipant = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatarSrc || contact.avatar
      };
      
      await initiateCall(participant, 'video');
    } catch (error) {
      console.error('Failed to start video call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioCall = async () => {
    if (callStatus !== 'idle') return;
    
    setIsLoading(true);
    try {
      const participant: CallParticipant = {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatarSrc || contact.avatar
      };
      
      await initiateCall(participant, 'audio');
    } catch (error) {
      console.error('Failed to start audio call:', error);
      alert('Failed to start audio call. Please check your microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  if (variant === 'icon') {
    return (
      <div className="flex space-x-2">
        <button
          onClick={handleVideoCall}
          disabled={isLoading || callStatus !== 'idle'}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
            isDark 
              ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-50' 
              : 'bg-green-100 hover:bg-green-200 text-green-600 disabled:opacity-50'
          }`}
          title="Start video call"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          ) : (
            <Video size={iconSizes[size]} />
          )}
        </button>
        
        <button
          onClick={handleAudioCall}
          disabled={isLoading || callStatus !== 'idle'}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-colors ${
            isDark 
              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50' 
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50'
          }`}
          title="Start audio call"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          ) : (
            <Phone size={iconSizes[size]} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleVideoCall}
        disabled={isLoading || callStatus !== 'idle'}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isDark 
            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-50' 
            : 'bg-green-100 hover:bg-green-200 text-green-600 disabled:opacity-50'
        }`}
      >
        <Video size={16} />
        <span className="text-sm font-medium">Video Call</span>
      </button>
      
      <button
        onClick={handleAudioCall}
        disabled={isLoading || callStatus !== 'idle'}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isDark 
            ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50' 
            : 'bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50'
        }`}
      >
        <Phone size={16} />
        <span className="text-sm font-medium">Audio Call</span>
      </button>
    </div>
  );
};

export default CallButton;
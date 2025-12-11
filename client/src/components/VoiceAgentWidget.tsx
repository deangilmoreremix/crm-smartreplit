// ElevenLabs widget completely disabled to prevent performance issues
import React from 'react';

interface VoiceAgentWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  minimizable?: boolean;
  agentId?: string;
}

const VoiceAgentWidget: React.FC<VoiceAgentWidgetProps> = () => {
  // Component disabled to prevent performance issues
  return null;
};

export default VoiceAgentWidget;
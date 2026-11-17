import React from 'react';
import AIApiKeySettings from '../aiIntegration/AIApiKeySettings';

interface AIProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: () => void;
}

/**
 * Thin wrapper over the server-backed AIApiKeySettings dialog. Keys are stored per user on the
 * server (user_api_keys); nothing is read from or written to browser storage here.
 */
const AIProviderSettingsModal: React.FC<AIProviderSettingsModalProps> = ({ isOpen, onClose }) => (
  <AIApiKeySettings
    open={isOpen}
    onOpenChange={(open) => {
      if (!open) onClose();
    }}
  />
);

export default AIProviderSettingsModal;

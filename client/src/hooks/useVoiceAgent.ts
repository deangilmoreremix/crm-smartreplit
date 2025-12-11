
// Hook disabled - ElevenLabs integration removed
export const useVoiceAgent = (config: any) => {
  return {
    isLoaded: false,
    isConnected: false,
    error: null,
    isLoading: false,
    connect: () => {},
    disconnect: () => {},
    retry: () => {},
    agentId: ''
  };
};

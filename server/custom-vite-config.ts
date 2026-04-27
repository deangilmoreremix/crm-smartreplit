// Custom Vite configuration to fix allowedHosts issue
export const customViteServerConfig = {
  allowedHosts: [
    '9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev',
    '.replit.dev',
    '.repl.co',
    '.riker.replit.dev',
    '*.riker.replit.dev',
    '.github.dev',
    '*.github.dev',
    '.app.github.dev',
    '*.app.github.dev',
    'friendly-capybara-97xppqw7rwqf7979-3000.app.github.dev',
    'localhost',
    '0.0.0.0',
    '36891',
    '40315',
    '40909',
  ],
  host: '0.0.0.0',
  // HMR configuration for GitHub Codespaces tunnel
  hmr: {
    protocol: 'ws',
    clientPort: 3000, // External port visible in browser (GitHub Codespaces port)
    host: 'friendly-capybara-97xppqw7rwqf7979-3000.app.github.dev', // Tunnel hostname
    overlay: false, // Disable overlay to prevent errors
    // Tell HMR client to connect to the tunnel URL instead of localhost
    clientConfig: {
      // Use the tunnel hostname for WebSocket connection
      host: 'friendly-capybara-97xppqw7rwqf7979-3000.app.github.dev',
      port: 3000,
    },
  },
};

// Export a function to merge this with existing config
export function mergeViteConfig(baseConfig: Record<string, unknown>) {
  return {
    ...baseConfig,
    server: {
      ...((baseConfig.server as Record<string, unknown>) || {}),
      ...customViteServerConfig,
    },
  };
}

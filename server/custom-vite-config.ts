// Custom Vite configuration to fix allowedHosts issue
export const customViteServerConfig = {
  middlewareMode: true,
  allowedHosts: [
    "9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev",
    ".replit.dev", 
    ".repl.co",
    ".riker.replit.dev",
    "*.riker.replit.dev",
    "localhost",
    "0.0.0.0"
  ],
  host: "0.0.0.0",
  port: 5173
};

// Export a function to merge this with existing config
export function mergeViteConfig(baseConfig: any) {
  return {
    ...baseConfig,
    server: {
      ...baseConfig.server,
      ...customViteServerConfig
    }
  };
}
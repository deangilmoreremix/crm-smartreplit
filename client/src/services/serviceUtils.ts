// Service utilities for Module Federation
import { unifiedEventSystem } from './unifiedEventSystem';

// Service synchronization utilities
export const createSyncedService = (serviceName: string, service: any) => {
  // Wrap service methods to emit events
  const wrappedService = Object.keys(service).reduce((wrapped, methodName) => {
    const originalMethod = service[methodName];

    if (typeof originalMethod === 'function') {
      wrapped[methodName] = async (...args: any[]) => {
        try {
          const result = await originalMethod.apply(service, args);

          // Emit success event
          unifiedEventSystem.emit({
            type: `SERVICE_SUCCESS_${serviceName.toUpperCase()}_${methodName.toUpperCase()}`,
            source: 'crm',
            data: { serviceName, methodName, args, result },
            priority: 'low'
          });

          return result;
        } catch (error) {
          // Emit error event
          unifiedEventSystem.emit({
            type: `SERVICE_ERROR_${serviceName.toUpperCase()}_${methodName.toUpperCase()}`,
            source: 'crm',
            data: { serviceName, methodName, args, error: error instanceof Error ? error.message : String(error) },
            priority: 'high'
          });

          throw error;
        }
      };
    } else {
      wrapped[methodName] = originalMethod;
    }

    return wrapped;
  }, {} as any);

  return wrappedService;
};

// Remote service call handler
export const handleRemoteServiceCall = (serviceName: string, services: Record<string, any>) => {
  const handlerId = `remote-${serviceName}-call`;

  const unsubscribe = unifiedEventSystem.registerHandler({
    id: handlerId,
    handler: async (event: any) => {
      if (event.type === `REMOTE_SERVICE_CALL_${serviceName.toUpperCase()}`) {
        const { methodName, args, requestId } = event.data;
        const service = services[serviceName];

        if (service && typeof service[methodName] === 'function') {
          try {
            const result = await service[methodName].apply(service, args);

            // Send result back
            unifiedEventSystem.emitTo(event.source, {
              type: `REMOTE_SERVICE_RESPONSE_${serviceName.toUpperCase()}`,
              source: 'crm',
              data: { requestId, result },
              priority: 'high'
            });
          } catch (error: any) {
            // Send error back
            unifiedEventSystem.emitTo(event.source, {
              type: `REMOTE_SERVICE_ERROR_${serviceName.toUpperCase()}`,
              source: 'crm',
              data: { requestId, error: error.message },
              priority: 'high'
            });
          }
        }
      }
    },
    priority: 5,
    filters: { type: `REMOTE_SERVICE_CALL_${serviceName.toUpperCase()}` }
  });

  return unsubscribe;
};

// Service discovery
export const discoverRemoteServices = (serviceNames: string[]) => {
  const discoveredServices: Record<string, any> = {};

  serviceNames.forEach(serviceName => {
    // Register handler for service discovery
    unifiedEventSystem.registerHandler({
      id: `service-discovery-${serviceName}`,
      handler: (event: any) => {
        if (event.type === `SERVICE_AVAILABLE_${serviceName.toUpperCase()}`) {
          discoveredServices[serviceName] = {
            available: true,
            source: event.source,
            methods: event.data.methods
          };
        }
      },
      priority: 5,
      filters: { type: `SERVICE_AVAILABLE_${serviceName.toUpperCase()}` }
    });

    // Request service discovery
    unifiedEventSystem.emit({
      type: `DISCOVER_SERVICE_${serviceName.toUpperCase()}`,
      source: 'crm',
      data: {},
      priority: 'low'
    });
  });

  return discoveredServices;
};

// Service health monitoring
export const monitorServiceHealth = (serviceName: string, service: any) => {
  const healthCheck = () => {
    try {
      // Basic health check - you can customize this
      const isHealthy = service && typeof service === 'object';

      unifiedEventSystem.emit({
        type: `SERVICE_HEALTH_${serviceName.toUpperCase()}`,
        source: 'crm',
        data: { serviceName, healthy: isHealthy, timestamp: Date.now() },
        priority: 'low'
      });
    } catch (error) {
      unifiedEventSystem.emit({
        type: `SERVICE_HEALTH_${serviceName.toUpperCase()}`,
        source: 'crm',
        data: { serviceName, healthy: false, error: error instanceof Error ? error.message : String(error), timestamp: Date.now() },
        priority: 'high'
      });
    }
  };

  // Check health every 30 seconds
  const intervalId = setInterval(healthCheck, 30000);

  // Initial health check
  healthCheck();

  return () => clearInterval(intervalId);
};
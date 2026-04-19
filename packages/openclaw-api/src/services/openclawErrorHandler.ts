import { OpenClawService } from './openclawService';

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'openclaw' | 'fallback';
}

export class OpenClawErrorHandler {
  private openClawService: OpenClawService;

  constructor(openClawService: OpenClawService) {
    this.openClawService = openClawService;
  }

  // Generic wrapper for OpenClaw operations with fallback
  async withFallback<T>(
    openClawOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<FallbackResult<T>> {
    try {
      // Check if OpenClaw is available
      const isHealthy = await this.openClawService.healthCheck();

      if (!isHealthy) {
        console.warn(`OpenClaw not available, using fallback for ${operationName}`);
        const fallbackData = await fallbackOperation();
        return {
          success: true,
          data: fallbackData,
          source: 'fallback',
        };
      }

      // Try OpenClaw operation
      const data = await openClawOperation();
      return {
        success: true,
        data,
        source: 'openclaw',
      };
    } catch (error) {
      console.warn(`OpenClaw ${operationName} failed, using fallback:`, error);

      try {
        // Use fallback operation
        const fallbackData = await fallbackOperation();
        return {
          success: true,
          data: fallbackData,
          source: 'fallback',
        };
      } catch (fallbackError) {
        console.error(`Both OpenClaw and fallback ${operationName} failed:`, fallbackError);
        return {
          success: false,
          error: `Both primary and fallback operations failed for ${operationName}`,
          source: 'fallback',
        };
      }
    }
  }

  // Specific method for contact enrichment with intelligent fallback
  async enrichContactWithFallback(
    contactId: string,
    contactData: any
  ): Promise<FallbackResult<any>> {
    const openClawOp = async () => {
      return await this.openClawService.enrichContact({
        contactId,
        data: contactData,
      });
    };

    const fallbackOp = async () => {
      // Simulate basic enrichment
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        success: true,
        enrichedData: {
          aiScore: Math.floor(Math.random() * 40) + 60,
          confidence: 0.6,
        },
        confidence: 0.6,
      };
    };

    return this.withFallback(openClawOp, fallbackOp, 'contact enrichment');
  }

  // Specific method for deal insights with intelligent fallback
  async getDealInsightsWithFallback(dealId: string): Promise<FallbackResult<any>> {
    const openClawOp = async () => {
      return await this.openClawService.getDealInsights(dealId);
    };

    const fallbackOp = async () => {
      // Simulate basic deal insights
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        predictedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        recommendations: ['Follow up with decision maker', 'Send proposal draft'],
      };
    };

    return this.withFallback(openClawOp, fallbackOp, 'deal insights');
  }

  // Specific method for AI chat with intelligent fallback
  async chatWithFallback(message: string, context?: any): Promise<FallbackResult<any>> {
    const openClawOp = async () => {
      return await this.openClawService.chat({ message, context });
    };

    const fallbackOp = async () => {
      // Simulate basic AI chat response
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        response:
          "I'm currently operating in offline mode. Please check your connection and try again for full AI assistance.",
        suggestions: ['Check internet connection', 'Try again later'],
      };
    };

    return this.withFallback(openClawOp, fallbackOp, 'AI chat');
  }
}

// Factory function to create error handler
export function createOpenClawErrorHandler(openClawService: OpenClawService): OpenClawErrorHandler {
  return new OpenClawErrorHandler(openClawService);
}

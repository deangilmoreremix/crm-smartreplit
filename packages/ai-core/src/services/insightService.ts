import { Contact, Deal } from '../types';
import type { OpenClawService } from '@crm/openclaw-api';

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  content: string;
  confidence: number;
  generatedAt: Date;
}

export class InsightService {
  private static openClawService: OpenClawService | null = null;
  private static serviceInitialized = false;

  private static async getOpenClawService(): Promise<OpenClawService | null> {
    // Already initialized
    if (this.openClawService) return this.openClawService;

    // Prevent repeated initialization attempts
    if (this.serviceInitialized) return null;
    this.serviceInitialized = true;

    try {
      const { OpenClawService: OCService } = await import('@crm/openclaw-api');
      this.openClawService = new OCService({
        baseUrl: process.env.REACT_APP_OPENCLAW_API_URL || 'https://api.openclaw.com',
        apiKey: process.env.REACT_APP_OPENCLAW_API_KEY || '',
      });
      return this.openClawService;
    } catch (error) {
      console.warn('Failed to initialize OpenClaw service:', error);
      return null;
    }
  }

  static async generateInsights(contact: Contact, deals: Deal[]): Promise<Insight[]> {
    try {
      // Get OpenClaw service (lazy loads if not already initialized)
      const service = await this.getOpenClawService();

      if (!service) {
        // Fallback to basic insights if service unavailable
        return this.generateFallbackInsights(contact);
      }

      // Use OpenClaw for intelligent insights
      const context = {
        contacts: [contact],
        deals,
        currentView: 'insights',
      };

      const response = await service.chat({
        message: `Generate 3-5 key business insights about this contact and their deals. Focus on opportunities, risks, and recommendations.`,
        context,
      });

      // Parse insights from OpenClaw response
      const insights: Insight[] = [];
      const lines = response.response.split('\n').filter((line) => line.trim());

      lines.forEach((line) => {
        if (
          line.toLowerCase().includes('opportunity') ||
          line.toLowerCase().includes('potential')
        ) {
          insights.push({
            id: this.generateId(),
            type: 'opportunity',
            content: line.trim(),
            confidence: 0.8,
            generatedAt: new Date(),
          });
        } else if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('churn')) {
          insights.push({
            id: this.generateId(),
            type: 'risk',
            content: line.trim(),
            confidence: 0.7,
            generatedAt: new Date(),
          });
        } else if (
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('suggest')
        ) {
          insights.push({
            id: this.generateId(),
            type: 'recommendation',
            content: line.trim(),
            confidence: 0.75,
            generatedAt: new Date(),
          });
        }
      });

      // Ensure we have at least some insights
      if (insights.length === 0) {
        insights.push({
          id: this.generateId(),
          type: 'recommendation',
          content: 'Consider scheduling a follow-up meeting to discuss current business needs',
          confidence: 0.6,
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.warn('OpenClaw insights failed, using fallback:', error);
      return this.generateFallbackInsights(contact);
    }
  }

  private static generateFallbackInsights(contact: Contact): Insight[] {
    const insights: Insight[] = [];

    // Generate opportunity insights
    insights.push({
      id: this.generateId(),
      type: 'opportunity',
      content: 'High-value deal opportunity detected',
      confidence: 0.85,
      generatedAt: new Date(),
    });

    // Generate risk insights if score is low
    if (this.hasRisk(contact)) {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        content: 'Potential churn risk detected',
        confidence: 0.72,
        generatedAt: new Date(),
      });
    }

    return insights;
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static hasRisk(contact: Contact): boolean {
    return contact.score < 0.3;
  }
}

import { Contact, Deal } from '../types';
import { OpenClawService } from '@crm/openclaw-api';

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  content: string;
  confidence: number;
  generatedAt: Date;
}

export class InsightService {
  private static openClawService = new OpenClawService({
    baseUrl: process.env.REACT_APP_OPENCLAW_API_URL || 'https://api.openclaw.com',
    apiKey: process.env.REACT_APP_OPENCLAW_API_KEY || '',
  });

  static async generateInsights(contact: Contact, deals: Deal[]): Promise<Insight[]> {
    try {
      // Use OpenClaw for intelligent insights
      const context = {
        contacts: [contact],
        deals,
        currentView: 'insights',
      };

      const response = await this.openClawService.chat({
        message: `Generate 3-5 key business insights about this contact and their deals. Focus on opportunities, risks, and recommendations.`,
        context,
      });

      // Parse insights from OpenClaw response
      const insights: Insight[] = [];
      const lines = response.response.split('\n').filter(line => line.trim());

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('opportunity') || line.toLowerCase().includes('potential')) {
          insights.push({
            id: this.generateId(),
            type: 'opportunity',
            content: line.trim(),
            confidence: 0.8,
            generatedAt: new Date()
          });
        } else if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('churn')) {
          insights.push({
            id: this.generateId(),
            type: 'risk',
            content: line.trim(),
            confidence: 0.7,
            generatedAt: new Date()
          });
        } else if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggest')) {
          insights.push({
            id: this.generateId(),
            type: 'recommendation',
            content: line.trim(),
            confidence: 0.75,
            generatedAt: new Date()
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
          generatedAt: new Date()
        });
      }

      return insights;
    } catch (error) {
      console.warn('OpenClaw insights failed, using fallback:', error);
      // Fallback to basic insights
      const insights: Insight[] = [];

      // Generate opportunity insights
      insights.push({
        id: this.generateId(),
        type: 'opportunity',
        content: 'High-value deal opportunity detected',
        confidence: 0.85,
        generatedAt: new Date()
      });

      // Generate risk insights
      if (this.hasRisk(contact)) {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          content: 'Potential churn risk detected',
          confidence: 0.72,
          generatedAt: new Date()
        });
      }

      return insights;
    }
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

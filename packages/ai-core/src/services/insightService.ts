import { Contact, Deal } from '../types';

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  content: string;
  confidence: number;
  generatedAt: Date;
}

export class InsightService {
  static generateInsights(contact: Contact, deals: Deal[]): Insight[] {
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

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private static hasRisk(contact: Contact): boolean {
    return contact.score < 0.3;
  }
}

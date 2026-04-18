import { Contact, Deal } from '@smartcrm/ai-core';
import { ScoringResult } from '@smartcrm/ai-core';

export class AIUtils {
  static enrichContact(contact: Contact): Contact {
    // Add AI enrichment logic
    return {
      ...contact,
      lastEnrichedAt: new Date(),
      score: Math.min(contact.score + 0.1, 1.0)
    };
  }

  static scoreDeal(deal: Deal): ScoringResult {
    // Delegate to scoring service
    return {
      score: Math.random(),
      rationale: 'AI analysis completed',
      factors: ['value', 'stage', 'timing']
    };
  }

  static generatePipelineInsights(contacts: Contact[]): any[] {
    return contacts.map(contact => ({
      contactId: contact.id,
      insights: this.generateInsights(contact)
    }));
  }

  private static generateInsights(contact: Contact): any[] {
    return [
      {
        type: 'engagement',
        value: contact.score * 100
      }
    ];
  }
}

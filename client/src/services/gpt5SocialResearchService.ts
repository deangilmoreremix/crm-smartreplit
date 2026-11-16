/**
 * GPT-5 Social Media Research Service
 * Advanced social media discovery using GPT-5's web research capabilities
 */

import { generateAI } from './aiGenerate';
import { Contact } from '../types';

export interface SocialPlatformProfile {
  platform: string;
  username: string;
  url: string;
  verified: boolean;
  followers?: number;
  engagement?: number;
  lastActivity?: Date;
  profileImage?: string;
  bio?: string;
  confidence: number;
}

export interface SocialResearchResult {
  contactId: string;
  profiles: SocialPlatformProfile[];
  personalityInsights: {
    traits: Record<string, string>;
    communicationStyle: string;
    professionalDemeanor: string;
    interests: string[];
    expertise: string[];
  };
  engagementMetrics: {
    averageEngagement: number;
    bestPostingTimes: string[];
    preferredContentTypes: string[];
    responsePatterns: string[];
  };
  professionalUpdates: {
    recentJobChanges: any[];
    companyNews: any[];
    achievements: any[];
    connections: any[];
  };
  monitoringRecommendations: string[];
  confidenceScore: number;
  lastResearched: Date;
}

export interface SocialMonitoringAlert {
  type: 'job_change' | 'company_news' | 'new_content' | 'engagement_spike' | 'connection_made';
  contactId: string;
  platform: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions: string[];
  timestamp: Date;
}

class GPT5SocialResearchService {
  /**
   * Social research from the CRM record. The AI model cannot browse the web, so profiles are only
   * the ones already stored on the contact (never invented); insights are generated from CRM data
   * with the user's own OpenAI key.
   */
  async researchContactSocialMedia(
    contact: Contact,
    _platforms: string[] = [],
    depth: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ): Promise<SocialResearchResult> {
    const profiles: SocialPlatformProfile[] = Object.entries(contact.socialProfiles || {})
      .filter(([, url]) => !!url)
      .map(([platform, url]) => ({
        platform,
        username: String(url).split('/').filter(Boolean).pop() || String(url),
        url: String(url),
        verified: false,
        confidence: 100,
      }));

    const { content } = await generateAI({
      json: true,
      tier: depth === 'basic' ? 'default' : 'advanced',
      system:
        'You are a sales research assistant. You cannot browse the web: base everything only on the CRM data given and say "unknown" rather than guessing facts.',
      prompt: `Return JSON {"personalityInsights": {"traits": object of string values, "communicationStyle": string, "professionalDemeanor": string, "interests": string[], "expertise": string[]}, "engagementMetrics": {"preferredContentTypes": string[], "responsePatterns": string[]}, "monitoringRecommendations": string[], "confidenceScore": number 0-100}.

Contact: ${JSON.stringify({
        name: contact.name,
        title: contact.title,
        company: contact.company,
        industry: contact.industry,
        notes: contact.notes,
        tags: contact.tags,
        knownProfiles: contact.socialProfiles,
      })}`,
    });
    const parsed = JSON.parse(content);

    return {
      contactId: contact.id,
      profiles,
      personalityInsights: {
        traits: parsed.personalityInsights?.traits || {},
        communicationStyle: parsed.personalityInsights?.communicationStyle || 'unknown',
        professionalDemeanor: parsed.personalityInsights?.professionalDemeanor || 'unknown',
        interests: parsed.personalityInsights?.interests || [],
        expertise: parsed.personalityInsights?.expertise || [],
      },
      engagementMetrics: {
        averageEngagement: 0,
        bestPostingTimes: [],
        preferredContentTypes: parsed.engagementMetrics?.preferredContentTypes || [],
        responsePatterns: parsed.engagementMetrics?.responsePatterns || [],
      },
      professionalUpdates: { recentJobChanges: [], companyNews: [], achievements: [], connections: [] },
      monitoringRecommendations: parsed.monitoringRecommendations || [],
      confidenceScore: Number(parsed.confidenceScore) || 0,
      lastResearched: new Date(),
    };
  }

  async validateSocialProfile(
    profile: SocialPlatformProfile,
    contact: Contact
  ): Promise<{ isValid: boolean; confidence: number; reasoning: string[] }> {
    const { content } = await generateAI({
      json: true,
      prompt: `Does this ${profile.platform} profile plausibly belong to this contact, judging only by the data given (no web access)? Return JSON {"isValid": boolean, "confidence": number 0-100, "reasoning": string[]}.
Profile: ${JSON.stringify(profile)}
Contact: ${JSON.stringify({ name: contact.name, company: contact.company, title: contact.title, email: contact.email })}`,
    });
    const parsed = JSON.parse(content);
    return {
      isValid: !!parsed.isValid,
      confidence: Number(parsed.confidence) || 0,
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    };
  }

  async getPersonalityInsights(
    contact: Contact,
    socialProfiles: SocialPlatformProfile[]
  ): Promise<{
    traits: Record<string, string>;
    communicationPreferences: string[];
    optimalApproach: string;
    riskFactors: string[];
    opportunities: string[];
  }> {
    const { content } = await generateAI({
      json: true,
      tier: 'advanced',
      prompt: `From this CRM data only (no web access), return JSON {"traits": object of string values, "communicationPreferences": string[], "optimalApproach": string, "riskFactors": string[], "opportunities": string[]}.
Contact: ${JSON.stringify({ name: contact.name, title: contact.title, company: contact.company, industry: contact.industry, notes: contact.notes })}
Known profiles: ${JSON.stringify(socialProfiles)}`,
    });
    return JSON.parse(content);
  }

  async setupSocialMonitoring(
    contactId: string,
    platforms: string[],
    alertTypes: string[]
  ): Promise<{ success: boolean; monitoringId: string }> {
    void contactId;
    void platforms;
    void alertTypes;
    throw new Error('Social media monitoring is not available.');
  }

  async getSocialMonitoringAlerts(_contactId: string): Promise<SocialMonitoringAlert[]> {
    // Social monitoring is not available; there are no alerts to report
    return [];
  }

  async bulkSocialResearch(
    contacts: Contact[],
    options: {
      platforms?: string[];
      depth?: 'basic' | 'comprehensive' | 'deep';
      batchSize?: number;
    } = {}
  ): Promise<Array<{ contactId: string; result: SocialResearchResult | null; error?: string }>> {
    const { platforms = [], depth = 'comprehensive', batchSize = 3 } = options;
    const results = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);

      const batchPromises = batch.map(async (contact) => {
        try {
          const result = await this.researchContactSocialMedia(contact, platforms, depth);
          return { contactId: contact.id, result };
        } catch (error) {
          return {
            contactId: contact.id,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches
      if (i + batchSize < contacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  // Utility methods
  isPlatformSupported(platform: string): boolean {
    const supportedPlatforms = [
      'LinkedIn',
      'Twitter',
      'Instagram',
      'TikTok',
      'YouTube',
      'GitHub',
      'Medium',
      'Facebook',
      'Snapchat',
      'Discord',
      'Reddit',
      'Pinterest',
      'Behance',
      'Dribbble',
      'AngelList',
      'Clubhouse',
      'Telegram',
    ];
    return supportedPlatforms.includes(platform);
  }

  getRecommendedPlatforms(contact: Contact): string[] {
    const recommendations = ['LinkedIn']; // Always include LinkedIn

    if (contact.company) {
      recommendations.push('Twitter', 'YouTube');
    }

    if (
      contact.title?.toLowerCase().includes('creative') ||
      contact.title?.toLowerCase().includes('design')
    ) {
      recommendations.push('Instagram', 'Behance', 'Dribbble');
    }

    if (
      contact.title?.toLowerCase().includes('developer') ||
      contact.title?.toLowerCase().includes('engineer')
    ) {
      recommendations.push('GitHub', 'Medium');
    }

    return recommendations;
  }
}

export const gpt5SocialResearchService = new GPT5SocialResearchService();

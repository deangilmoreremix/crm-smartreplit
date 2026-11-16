/**
 * Social media research.
 * Uses the OpenAI Responses API with live web search (POST /api/ai/research) to find a contact's public
 * profiles; results carry the source URLs the model cited. Runs on the user's own OpenAI key.
 */

import { generateAI, researchAI, type UrlSource } from './aiGenerate';
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
  /** Web pages the research cited. */
  sources?: UrlSource[];
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
   * Find the contact's public social profiles with live web search and summarise them.
   * Only profiles the search actually found are returned, each with its URL; sources lists the cited pages.
   */
  async researchContactSocialMedia(
    contact: Contact,
    platforms: string[] = [],
    depth: 'basic' | 'comprehensive' | 'deep' = 'comprehensive'
  ): Promise<SocialResearchResult> {
    const stringList = { type: 'array', items: { type: 'string' } };
    const schema = {
      type: 'object',
      additionalProperties: false,
      required: ['profiles', 'personalityInsights', 'engagementMetrics', 'professionalUpdates', 'monitoringRecommendations', 'confidenceScore'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['platform', 'username', 'url', 'verified', 'bio', 'confidence'],
            properties: {
              platform: { type: 'string' },
              username: { type: 'string' },
              url: { type: 'string' },
              verified: { type: 'boolean' },
              bio: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        },
        personalityInsights: {
          type: 'object',
          additionalProperties: false,
          required: ['traits', 'communicationStyle', 'professionalDemeanor', 'interests', 'expertise'],
          properties: {
            traits: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'value'],
                properties: { name: { type: 'string' }, value: { type: 'string' } },
              },
            },
            communicationStyle: { type: 'string' },
            professionalDemeanor: { type: 'string' },
            interests: stringList,
            expertise: stringList,
          },
        },
        engagementMetrics: {
          type: 'object',
          additionalProperties: false,
          required: ['preferredContentTypes', 'responsePatterns'],
          properties: { preferredContentTypes: stringList, responsePatterns: stringList },
        },
        professionalUpdates: {
          type: 'object',
          additionalProperties: false,
          required: ['recentJobChanges', 'companyNews', 'achievements'],
          properties: { recentJobChanges: stringList, companyNews: stringList, achievements: stringList },
        },
        monitoringRecommendations: stringList,
        confidenceScore: { type: 'number' },
      },
    };

    const { data, sources } = await researchAI({
      tier: depth === 'basic' ? 'default' : 'advanced',
      schema,
      schemaName: 'social_research',
      system:
        'You are a sales research assistant with web search. Only report profiles and facts you found on the web for this exact person, with the profile URL; never invent profiles. Use "unknown" or empty lists when nothing is found.',
      prompt: `Find the public social media profiles${platforms.length ? ` (platforms: ${platforms.join(', ')})` : ''} and recent professional news for this person, then summarise them for a salesperson.

Person: ${JSON.stringify({
        name: contact.name,
        title: contact.title,
        company: contact.company,
        industry: contact.industry,
        email: contact.email,
        knownProfiles: contact.socialProfiles,
      })}`,
    });
    const parsed = data || {};

    return {
      contactId: contact.id,
      profiles: (parsed.profiles || [])
        .filter((p: any) => p?.url)
        .map((p: any) => ({
          platform: p.platform,
          username: p.username,
          url: p.url,
          verified: !!p.verified,
          bio: p.bio || undefined,
          confidence: Number(p.confidence) || 0,
        })),
      personalityInsights: {
        traits: Object.fromEntries((parsed.personalityInsights?.traits || []).map((t: any) => [t.name, t.value])),
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
      professionalUpdates: {
        recentJobChanges: parsed.professionalUpdates?.recentJobChanges || [],
        companyNews: parsed.professionalUpdates?.companyNews || [],
        achievements: parsed.professionalUpdates?.achievements || [],
        connections: [],
      },
      monitoringRecommendations: parsed.monitoringRecommendations || [],
      confidenceScore: Number(parsed.confidenceScore) || 0,
      lastResearched: new Date(),
      sources,
    };
  }

  async validateSocialProfile(
    profile: SocialPlatformProfile,
    contact: Contact
  ): Promise<{ isValid: boolean; confidence: number; reasoning: string[] }> {
    const { data: parsed } = await generateAI({
      schemaName: 'profile_validation',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['isValid', 'confidence', 'reasoning'],
        properties: {
          isValid: { type: 'boolean' },
          confidence: { type: 'number' },
          reasoning: { type: 'array', items: { type: 'string' } },
        },
      },
      prompt: `Does this ${profile.platform} profile plausibly belong to this contact, judging by the data given? confidence is 0-100.
Profile: ${JSON.stringify(profile)}
Contact: ${JSON.stringify({ name: contact.name, company: contact.company, title: contact.title, email: contact.email })}`,
    });
    if (!parsed) throw new Error('Profile validation returned no result');
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
      prompt: `From this CRM data and the known profiles, return JSON {"traits": object of string values, "communicationPreferences": string[], "optimalApproach": string, "riskFactors": string[], "opportunities": string[]}.
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

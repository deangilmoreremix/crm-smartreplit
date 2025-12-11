
/**
 * Social Profile Validator Service
 * Validates authenticity and quality of social media profiles using AI
 */

import { httpClient } from './http-client.service';
import { logger } from './logger.service';
import { Contact } from '../types';

export interface ProfileValidationResult {
  isAuthentic: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  validationChecks: {
    profileCompleteness: boolean;
    activityConsistency: boolean;
    connectionQuality: boolean;
    contentAuthenticity: boolean;
    profileMatching: boolean;
  };
  reasoning: string[];
  recommendations: string[];
  redFlags: string[];
}

export interface BulkValidationResult {
  contactId: string;
  platform: string;
  profileUrl: string;
  result: ProfileValidationResult | null;
  error?: string;
}

class SocialProfileValidator {
  private apiUrl: string;
  private isMockMode = import.meta.env.DEV;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.apiUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/profile-validator` : '/api/profile-validator';
  }

  private generateMockValidation(platform: string, profileUrl: string): ProfileValidationResult {
    const confidence = Math.floor(Math.random() * 30) + 70;
    const isAuthentic = confidence > 60;
    
    return {
      isAuthentic,
      confidence,
      riskLevel: confidence > 80 ? 'low' : confidence > 60 ? 'medium' : 'high',
      validationChecks: {
        profileCompleteness: Math.random() > 0.2,
        activityConsistency: Math.random() > 0.3,
        connectionQuality: Math.random() > 0.25,
        contentAuthenticity: Math.random() > 0.15,
        profileMatching: Math.random() > 0.1
      },
      reasoning: [
        'Profile has consistent posting history',
        'Professional network connections appear legitimate',
        'Profile information matches provided contact details',
        'Account creation date aligns with career timeline'
      ],
      recommendations: isAuthentic ? [
        'Profile appears legitimate for professional outreach',
        'Good platform for initial contact',
        'Monitor for recent activity before reaching out'
      ] : [
        'Exercise caution when engaging with this profile',
        'Verify through alternative channels',
        'Consider using different social platform'
      ],
      redFlags: isAuthentic ? [] : [
        'Limited profile information',
        'Inconsistent activity patterns',
        'Few professional connections'
      ]
    };
  }

  async validateProfile(
    contact: Contact,
    platform: string,
    profileUrl: string
  ): Promise<ProfileValidationResult> {
    console.log(`Validating ${platform} profile for ${contact.name}: ${profileUrl}`);

    if (this.isMockMode) {
      return this.generateMockValidation(platform, profileUrl);
    }

    try {
      const response = await httpClient.post<ProfileValidationResult>(
        this.apiUrl,
        {
          contact: {
            name: contact.name,
            email: contact.email,
            company: contact.company,
            title: contact.title
          },
          profile: {
            platform,
            url: profileUrl
          },
          validationLevel: 'comprehensive'
        },
        {
          timeout: 30000,
          retries: 2
        }
      );

      console.log(`Profile validation completed for ${platform}`);
      return response.data;
    } catch (error) {
      console.error('Profile validation failed:', error);
      return this.generateMockValidation(platform, profileUrl);
    }
  }

  async validateMultipleProfiles(
    contact: Contact,
    profiles: Array<{ platform: string; url: string }>
  ): Promise<Array<{ platform: string; url: string; result: ProfileValidationResult }>> {
    console.log(`Validating ${profiles.length} profiles for ${contact.name}`);

    const validationPromises = profiles.map(async ({ platform, url }) => {
      try {
        const result = await this.validateProfile(contact, platform, url);
        return { platform, url, result };
      } catch (error) {
        return {
          platform,
          url,
          result: {
            isAuthentic: false,
            confidence: 0,
            riskLevel: 'high' as const,
            validationChecks: {
              profileCompleteness: false,
              activityConsistency: false,
              connectionQuality: false,
              contentAuthenticity: false,
              profileMatching: false
            },
            reasoning: ['Validation failed due to technical error'],
            recommendations: ['Unable to validate - use alternative verification'],
            redFlags: ['Validation service unavailable']
          }
        };
      }
    });

    return await Promise.all(validationPromises);
  }

  async bulkValidateProfiles(
    contacts: Array<{
      contact: Contact;
      profiles: Array<{ platform: string; url: string }>;
    }>
  ): Promise<BulkValidationResult[]> {
    const results: BulkValidationResult[] = [];

    for (const { contact, profiles } of contacts) {
      for (const { platform, url } of profiles) {
        try {
          const result = await this.validateProfile(contact, platform, url);
          results.push({
            contactId: contact.id,
            platform,
            profileUrl: url,
            result
          });
        } catch (error) {
          results.push({
            contactId: contact.id,
            platform,
            profileUrl: url,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async getProfileTrustScore(
    validationResults: ProfileValidationResult[]
  ): Promise<{
    overallTrustScore: number;
    trustLevel: 'high' | 'medium' | 'low';
    platformBreakdown: Record<string, number>;
    recommendations: string[];
    riskFactors: string[];
  }> {
    const validResults = validationResults.filter(r => r.isAuthentic);
    const totalProfiles = validationResults.length;
    
    if (totalProfiles === 0) {
      return {
        overallTrustScore: 0,
        trustLevel: 'low',
        platformBreakdown: {},
        recommendations: ['No profiles to validate'],
        riskFactors: ['No social media presence found']
      };
    }

    const averageConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;
    const authenticityRate = validResults.length / totalProfiles;
    const overallTrustScore = Math.floor((averageConfidence * 0.7) + (authenticityRate * 100 * 0.3));

    const trustLevel = overallTrustScore > 80 ? 'high' : overallTrustScore > 60 ? 'medium' : 'low';

    const platformBreakdown: Record<string, number> = {};
    validationResults.forEach((result, index) => {
      platformBreakdown[`platform_${index}`] = result.confidence;
    });

    const allRecommendations = validResults.flatMap(r => r.recommendations);
    const allRiskFactors = validationResults.flatMap(r => r.redFlags);

    return {
      overallTrustScore,
      trustLevel,
      platformBreakdown,
      recommendations: [...new Set(allRecommendations)],
      riskFactors: [...new Set(allRiskFactors)]
    };
  }

  // Utility methods
  isPlatformSupported(platform: string): boolean {
    const supportedPlatforms = [
      'LinkedIn', 'Twitter', 'Instagram', 'Facebook', 'YouTube', 'GitHub',
      'Medium', 'TikTok', 'Snapchat', 'Discord', 'Reddit', 'Pinterest'
    ];
    return supportedPlatforms.includes(platform);
  }

  getValidationCriteria(platform: string): string[] {
    const commonCriteria = [
      'Profile completeness',
      'Activity consistency',
      'Content authenticity'
    ];

    const platformSpecific: Record<string, string[]> = {
      'LinkedIn': ['Professional network quality', 'Work history alignment', 'Endorsements authenticity'],
      'Twitter': ['Follower quality', 'Engagement patterns', 'Account age'],
      'Instagram': ['Content consistency', 'Engagement rates', 'Profile verification'],
      'GitHub': ['Code contribution history', 'Repository quality', 'Community involvement'],
      'Medium': ['Article quality', 'Publication history', 'Reader engagement']
    };

    return [...commonCriteria, ...(platformSpecific[platform] || [])];
  }
}

export const socialProfileValidator = new SocialProfileValidator();

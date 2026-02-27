/**
 * Default Score Weights for Deal Scoring
 * 
 * Used throughout the application for calculating deal scores,
 * priority rankings, and AI-powered insights.
 */

// Default weights for deal scoring
export const DEFAULT_SCORE_WEIGHTS = {
  // Deal value factors
  dealValue: 0.25,
  dealVelocity: 0.15,
  
  // Contact factors
  contactEngagement: 0.20,
  contactAuthority: 0.10,
  
  // Activity factors
  recentActivity: 0.15,
  meetingCount: 0.10,
  
  // Time factors
  daysSinceCreation: 0.05,
};

// Alternative scoring weights for different industries
export const INDUSTRY_WEIGHTS = {
  // SaaS / Technology
  saas: {
    dealValue: 0.30,
    dealVelocity: 0.20,
    contactEngagement: 0.15,
    contactAuthority: 0.15,
    recentActivity: 0.10,
    meetingCount: 0.05,
    daysSinceCreation: 0.05,
  },
  
  // Enterprise / B2B
  enterprise: {
    dealValue: 0.35,
    dealVelocity: 0.10,
    contactEngagement: 0.15,
    contactAuthority: 0.20,
    recentActivity: 0.10,
    meetingCount: 0.05,
    daysSinceCreation: 0.05,
  },
  
  // SMB / Local Business
  smb: {
    dealValue: 0.20,
    dealVelocity: 0.20,
    contactEngagement: 0.25,
    contactAuthority: 0.05,
    recentActivity: 0.15,
    meetingCount: 0.10,
    daysSinceCreation: 0.05,
  },
};

/**
 * Get score weights by industry type
 */
export function getScoreWeights(industry?: string): typeof DEFAULT_SCORE_WEIGHTS {
  if (industry && industry in INDUSTRY_WEIGHTS) {
    return INDUSTRY_WEIGHTS[industry as keyof typeof INDUSTRY_WEIGHTS];
  }
  return DEFAULT_SCORE_WEIGHTS;
}

/**
 * Calculate a deal score using weights
 */
export function calculateDealScore(
  deal: {
    value?: number;
    velocity?: number;
    contactEngagement?: number;
    contactAuthority?: number;
    recentActivity?: number;
    meetingCount?: number;
    daysSinceCreation?: number;
  },
  weights: typeof DEFAULT_SCORE_WEIGHTS = DEFAULT_SCORE_WEIGHTS
): number {
  const safeDeal = deal || {};
  
  const scores = {
    dealValue: (safeDeal.value || 0) * weights.dealValue,
    dealVelocity: (safeDeal.velocity || 0) * weights.dealVelocity,
    contactEngagement: (safeDeal.contactEngagement || 0) * weights.contactEngagement,
    contactAuthority: (safeDeal.contactAuthority || 0) * weights.contactAuthority,
    recentActivity: (safeDeal.recentActivity || 0) * weights.recentActivity,
    meetingCount: (safeDeal.meetingCount || 0) * weights.meetingCount,
    daysSinceCreation: Math.max(0, 1 - (safeDeal.daysSinceCreation || 0) / 365) * weights.daysSinceCreation,
  };
  
  return Object.values(scores).reduce((sum, score) => sum + score, 0);
}

export default DEFAULT_SCORE_WEIGHTS;

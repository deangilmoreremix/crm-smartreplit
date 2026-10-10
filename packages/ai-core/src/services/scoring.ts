import { Contact } from '../types';

export interface ScoreContactInput {
  contact: Contact;
  historicalData?: {
    emailsOpened: number;
    meetingsHeld: number;
    dealsClosed: number;
    responseRate: number;
  };
  contextFactors?: {
    industry?: string;
    companySize?: string;
    dealValue?: number;
    pipelineStage?: string;
  };
}

export interface ScoreBreakdown {
  engagement: number;
  demographic: number;
  behavioral: number;
  firmographic: number;
}

export interface ScoreContactOutput {
  contactId: string;
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: ScoreBreakdown;
  factors: string[];
  rationale: string;
  recommendations: string[];
  confidence: number;
  scoredAt: Date;
}

export interface ScoringWeights {
  engagement: number;
  demographic: number;
  behavioral: number;
  firmographic: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  engagement: 0.25,
  demographic: 0.2,
  behavioral: 0.3,
  firmographic: 0.25,
};

export class ScoringServiceV2 {
  private static weights: ScoringWeights = { ...DEFAULT_WEIGHTS };

  static async scoreContact(input: ScoreContactInput): Promise<ScoreContactOutput> {
    const { contact, historicalData, contextFactors } = input;

    const breakdown = this.calculateBreakdown(contact, historicalData, contextFactors);
    const totalScore = this.computeTotalScore(breakdown);
    const grade = this.determineGrade(totalScore);
    const factors = this.identifyFactors(breakdown);
    const rationale = this.generateRationale(contact, breakdown, totalScore);
    const recommendations = this.generateRecommendations(grade, breakdown);
    const confidence = this.calculateConfidence(historicalData, breakdown);

    return {
      contactId: contact.id,
      totalScore,
      grade,
      breakdown,
      factors,
      rationale,
      recommendations,
      confidence,
      scoredAt: new Date(),
    };
  }

  static calculateBreakdown(
    contact: Contact,
    historicalData?: ScoreContactInput['historicalData'],
    contextFactors?: ScoreContactInput['contextFactors']
  ): ScoreBreakdown {
    return {
      engagement: this.scoreEngagement(historicalData),
      demographic: this.scoreDemographic(contact),
      behavioral: this.scoreBehavioral(contact, historicalData),
      firmographic: this.scoreFirmographic(contact, contextFactors),
    };
  }

  private static scoreEngagement(data?: ScoreContactInput['historicalData']): number {
    if (!data) return 0.5;

    const { emailsOpened = 0, meetingsHeld = 0, responseRate = 0 } = data;
    const emailScore = Math.min(emailsOpened / 10, 1) * 0.4;
    const meetingScore = Math.min(meetingsHeld / 5, 1) * 0.4;
    const responseScore = responseRate * 0.2;

    return Math.min(emailScore + meetingScore + responseScore, 1);
  }

  private static scoreDemographic(contact: Contact): number {
    let score = 0.5;

    if (contact.email?.includes('company')) score += 0.1;
    if (contact.company) score += 0.2;
    if ((contact as any).jobTitle) score += 0.2;

    return Math.min(score, 1);
  }

  private static scoreBehavioral(
    contact: Contact,
    data?: ScoreContactInput['historicalData']
  ): number {
    let score = 0.6;

    if ((contact as any).lastActivity) score += 0.2;
    if ((contact as any).engagementScore > 50) score += 0.2;
    if (data?.dealsClosed > 0) score += 0.2;

    return Math.min(score, 1);
  }

  private static scoreFirmographic(
    contact: Contact,
    context?: ScoreContactInput['contextFactors']
  ): number {
    let score = 0.5;

    if (context?.industry) score += 0.2;
    if (context?.companySize) score += 0.2;
    if (context?.dealValue && context.dealValue > 10000) score += 0.2;
    if ((contact as any).industry) score += 0.1;

    return Math.min(score, 1);
  }

  private static computeTotalScore(breakdown: ScoreBreakdown): number {
    const weights = this.weights;
    return Math.round(
      (breakdown.engagement * weights.engagement +
        breakdown.demographic * weights.demographic +
        breakdown.behavioral * weights.behavioral +
        breakdown.firmographic * weights.firmographic) *
        100
    );
  }

  private static determineGrade(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  private static identifyFactors(breakdown: ScoreBreakdown): string[] {
    const factors: string[] = [];

    if (breakdown.engagement >= 0.7) factors.push('High engagement');
    else if (breakdown.engagement < 0.4) factors.push('Low engagement');

    if (breakdown.demographic >= 0.7) factors.push('Strong demographic fit');
    if (breakdown.behavioral >= 0.7) factors.push('Positive behavioral signals');
    if (breakdown.firmographic >= 0.7) factors.push('Ideal firmographic match');

    if (factors.length === 0) factors.push('Average profile');

    return factors;
  }

  private static generateRationale(
    contact: Contact,
    breakdown: ScoreBreakdown,
    totalScore: number
  ): string {
    const company = contact.company || 'this company';
    const parts: string[] = [];

    parts.push(`${contact.name} at ${company} scored ${totalScore}/100`);

    if (breakdown.engagement >= 0.7) {
      parts.push('showing excellent engagement with emails and meetings');
    } else if (breakdown.engagement < 0.4) {
      parts.push('needs improvement in engagement activities');
    }

    if (breakdown.firmographic >= 0.7) {
      parts.push('excellent fit based on company characteristics');
    }

    return parts.join('. ') + '.';
  }

  private static generateRecommendations(
    grade: 'A' | 'B' | 'C' | 'D',
    breakdown: ScoreBreakdown
  ): string[] {
    const recommendations: string[] = [];

    if (grade === 'A') {
      recommendations.push('Priority for high-value deals');
      recommendations.push('Consider for beta programs or early access');
    } else if (grade === 'B') {
      recommendations.push('Good candidate for nurturing campaigns');
      if (breakdown.engagement < 0.5) {
        recommendations.push('Increase touchpoints to improve conversion');
      }
    } else if (grade === 'C') {
      recommendations.push('Needs more engagement before sales push');
      recommendations.push('Consider educational content');
    } else {
      recommendations.push('Re-evaluate fit before investing resources');
      recommendations.push('Focus on engagement improvements');
    }

    return recommendations;
  }

  private static calculateConfidence(
    data?: ScoreContactInput['historicalData'],
    breakdown?: ScoreBreakdown
  ): number {
    let confidence = 0.5;

    if (data) confidence += 0.3;
    if (breakdown) {
      if (breakdown.engagement > 0 && breakdown.demographic > 0) confidence += 0.1;
      if (breakdown.behavioral > 0.3 && breakdown.firmographic > 0.3) confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  static updateScoringWeights(
    outcome: 'won' | 'lost',
    actualScore: number,
    predictedScore: number
  ): void {
    const adjustment = outcome === 'won' ? 0.05 : -0.05;
    const error = actualScore - predictedScore;

    if (error > 10) {
      this.weights.engagement += adjustment;
      this.weights.behavioral += adjustment;
    } else if (error < -10) {
      this.weights.firmographic += adjustment;
      this.weights.demographic += adjustment;
    }

    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.01) {
      this.weights.engagement /= total;
      this.weights.demographic /= total;
      this.weights.behavioral /= total;
      this.weights.firmographic /= total;
    }
  }

  static getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  static resetWeights(): void {
    this.weights = { ...DEFAULT_WEIGHTS };
  }
}
